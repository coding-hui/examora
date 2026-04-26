package server

import (
	"bytes"
	"context"
	"errors"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/infra/config"
	"github.com/coding-hui/examora/internal/judge"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

type SandboxServer struct {
	cfg config.Config
}

func NewSandboxServer(cfg config.Config) *SandboxServer {
	return &SandboxServer{cfg: cfg}
}

func (s *SandboxServer) Run() error {
	router := gin.Default()
	router.POST("/run", func(c *gin.Context) {
		var req judge.SandboxRunRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			response.BadRequest(c, "invalid request")
			return
		}
		result := executeSandbox(c.Request.Context(), req)
		c.JSON(http.StatusOK, result)
	})
	return router.Run("0.0.0.0:8081")
}

func executeSandbox(parent context.Context, req judge.SandboxRunRequest) judge.SandboxRunResult {
	limitMS := req.TimeLimitMS
	if limitMS <= 0 {
		limitMS = 2000
	}
	ctx, cancel := context.WithTimeout(parent, time.Duration(limitMS)*time.Millisecond)
	defer cancel()

	dir, err := os.MkdirTemp("", "examora-sandbox-*")
	if err != nil {
		return judge.SandboxRunResult{Status: "SYSTEM_ERROR", Stderr: err.Error()}
	}
	defer func() { _ = os.RemoveAll(dir) }()

	cmd, err := sandboxCommand(ctx, dir, req)
	if err != nil {
		return judge.SandboxRunResult{Status: "COMPILE_ERROR", Stderr: err.Error()}
	}
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	cmd.Stdin = strings.NewReader(req.Stdin)
	start := time.Now()
	err = cmd.Run()
	elapsed := time.Since(start).Milliseconds()
	if errors.Is(ctx.Err(), context.DeadlineExceeded) {
		return judge.SandboxRunResult{Status: "TIME_LIMIT_EXCEEDED", Stdout: stdout.String(), Stderr: stderr.String(), TimeMS: elapsed}
	}
	if err != nil {
		exitCode := 1
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) {
			exitCode = exitErr.ExitCode()
		}
		return judge.SandboxRunResult{Status: "RUNTIME_ERROR", Stdout: stdout.String(), Stderr: stderr.String(), ExitCode: exitCode, TimeMS: elapsed}
	}
	return judge.SandboxRunResult{Status: "ACCEPTED", Stdout: stdout.String(), Stderr: stderr.String(), ExitCode: 0, TimeMS: elapsed}
}

func sandboxCommand(ctx context.Context, dir string, req judge.SandboxRunRequest) (*exec.Cmd, error) {
	language := strings.ToLower(req.Language)
	switch language {
	case "python", "python3":
		path := filepath.Join(dir, "main.py")
		if err := os.WriteFile(path, []byte(req.SourceCode), 0600); err != nil {
			return nil, err
		}
		return exec.CommandContext(ctx, "python3", path), nil
	case "javascript", "js", "node":
		path := filepath.Join(dir, "main.js")
		if err := os.WriteFile(path, []byte(req.SourceCode), 0600); err != nil {
			return nil, err
		}
		return exec.CommandContext(ctx, "node", path), nil
	case "go", "golang":
		path := filepath.Join(dir, "main.go")
		if err := os.WriteFile(path, []byte(req.SourceCode), 0600); err != nil {
			return nil, err
		}
		cmd := exec.CommandContext(ctx, "go", "run", path)
		cmd.Env = append(os.Environ(), "GOCACHE="+filepath.Join(dir, "gocache"))
		return cmd, nil
	default:
		return nil, errors.New("unsupported language")
	}
}
