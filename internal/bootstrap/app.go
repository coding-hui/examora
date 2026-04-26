package bootstrap

import (
	"bytes"
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/hibiken/asynq"

	authhttp "github.com/coding-hui/examora/internal/auth/delivery/http"
	authlogto "github.com/coding-hui/examora/internal/auth/repository/logto"
	authpostgres "github.com/coding-hui/examora/internal/auth/repository/postgres"
	authusecase "github.com/coding-hui/examora/internal/auth/usecase"
	clienthttp "github.com/coding-hui/examora/internal/client/delivery/http"
	clientpostgres "github.com/coding-hui/examora/internal/client/repository/postgres"
	clientusecase "github.com/coding-hui/examora/internal/client/usecase"
	examhttp "github.com/coding-hui/examora/internal/exam/delivery/http"
	exampostgres "github.com/coding-hui/examora/internal/exam/repository/postgres"
	examusecase "github.com/coding-hui/examora/internal/exam/usecase"
	judgehttp "github.com/coding-hui/examora/internal/judge/delivery/http"
	judgeworker "github.com/coding-hui/examora/internal/judge/delivery/worker"
	judgepostgres "github.com/coding-hui/examora/internal/judge/repository/postgres"
	judgequeue "github.com/coding-hui/examora/internal/judge/repository/queue"
	judgesandbox "github.com/coding-hui/examora/internal/judge/repository/sandbox"
	judgeusecase "github.com/coding-hui/examora/internal/judge/usecase"
	paperhttp "github.com/coding-hui/examora/internal/paper/delivery/http"
	paperpostgres "github.com/coding-hui/examora/internal/paper/repository/postgres"
	paperusecase "github.com/coding-hui/examora/internal/paper/usecase"
	"github.com/coding-hui/examora/internal/platform/config"
	"github.com/coding-hui/examora/internal/platform/database"
	"github.com/coding-hui/examora/internal/platform/logger"
	platformredis "github.com/coding-hui/examora/internal/platform/redis"
	"github.com/coding-hui/examora/internal/platform/transaction"
	questionhttp "github.com/coding-hui/examora/internal/question/delivery/http"
	questionpostgres "github.com/coding-hui/examora/internal/question/repository/postgres"
	questionusecase "github.com/coding-hui/examora/internal/question/usecase"
	submissionhttp "github.com/coding-hui/examora/internal/submission/delivery/http"
	submissionpostgres "github.com/coding-hui/examora/internal/submission/repository/postgres"
	submissionusecase "github.com/coding-hui/examora/internal/submission/usecase"
	"github.com/coding-hui/examora/internal/transport/http/middleware"
	"github.com/coding-hui/examora/internal/transport/http/response"
	userhttp "github.com/coding-hui/examora/internal/user/delivery/http"
	userpostgres "github.com/coding-hui/examora/internal/user/repository/postgres"
	userusecase "github.com/coding-hui/examora/internal/user/usecase"
)

type APIApp struct {
	cfg    config.Config
	logger *slog.Logger
	router *gin.Engine
}

type WorkerApp struct {
	cfg    config.Config
	logger *slog.Logger
	server *asynq.Server
	mux    *asynq.ServeMux
}

type SandboxApp struct {
	cfg config.Config
}

func NewAPIApp() *APIApp {
	cfg := config.Load()
	log := logger.New(cfg.LogLevel)
	container := buildContainer(cfg, log)
	if err := container.userUC.EnsureSeedAdmin(context.Background(), cfg.SeedAdminSubject, cfg.SeedAdminDisplayName); err != nil {
		log.Warn("seed admin check failed", "error", err)
	} else if cfg.SeedAdminSubject != "" {
		log.Info("seed admin ensured", "subject", cfg.SeedAdminSubject)
	}
	router := buildRouter(container)
	return &APIApp{cfg: cfg, logger: log, router: router}
}

func (a *APIApp) Run() error {
	a.logger.Info("api starting", "addr", a.cfg.Address())
	return a.router.Run(a.cfg.Address())
}

func NewWorkerApp() *WorkerApp {
	cfg := config.Load()
	log := logger.New(cfg.LogLevel)
	container := buildContainer(cfg, log)
	mux := asynq.NewServeMux()
	judgeworker.New(container.judgeUC).Register(mux)
	server := asynq.NewServer(asynq.RedisClientOpt{Addr: cfg.RedisAddr, Password: cfg.RedisPassword, DB: cfg.RedisDB}, asynq.Config{Concurrency: 4, Queues: map[string]int{"judge": 10, "default": 1}})
	return &WorkerApp{cfg: cfg, logger: log, server: server, mux: mux}
}

func (a *WorkerApp) Run() error {
	a.logger.Info("worker starting")
	return a.server.Run(a.mux)
}

func NewSandboxApp() *SandboxApp {
	return &SandboxApp{cfg: config.Load()}
}

func (a *SandboxApp) Run() error {
	router := gin.Default()
	router.POST("/run", func(c *gin.Context) {
		var req judgeusecase.SandboxRunRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			response.BadRequest(c, "invalid request")
			return
		}
		result := executeSandbox(c.Request.Context(), req)
		c.JSON(http.StatusOK, result)
	})
	return router.Run("0.0.0.0:8081")
}

type container struct {
	authUC       *authusecase.Usecase
	userUC       *userusecase.Usecase
	questionUC   *questionusecase.Usecase
	paperUC      *paperusecase.Usecase
	examUC       *examusecase.Usecase
	submissionUC *submissionusecase.Usecase
	judgeUC      *judgeusecase.Usecase
	clientUC     *clientusecase.Usecase
}

func buildContainer(cfg config.Config, log *slog.Logger) *container {
	db, err := database.Open(cfg.DatabaseDSN)
	if err != nil {
		panic(err)
	}
	if err := database.AutoMigrate(db); err != nil {
		panic(err)
	}
	if _, err := platformredis.New(cfg.RedisAddr, cfg.RedisPassword, cfg.RedisDB); err != nil {
		log.Warn("redis ping failed; asynq may fail until redis is available", "error", err)
	}
	asynqClient := asynq.NewClient(asynq.RedisClientOpt{Addr: cfg.RedisAddr, Password: cfg.RedisPassword, DB: cfg.RedisDB})
	tx := transaction.NewManager(db)

	authRepo := authpostgres.New(db)
	authUC := authusecase.New(authRepo, authlogto.NewVerifier(cfg))
	userUC := userusecase.New(userpostgres.New(db))
	questionRepo := questionpostgres.New(db)
	questionUC := questionusecase.New(questionRepo)
	paperUC := paperusecase.New(paperpostgres.New(db), questionUC)
	examUC := examusecase.New(exampostgres.New(db), paperUC)
	submissionRepo := submissionpostgres.New(db)
	judgeRepo := judgepostgres.New(db)
	judgeUC := judgeusecase.New(judgeRepo, submissionRepo, judgeRepo, judgequeue.New(asynqClient), judgesandbox.New(cfg.SandboxAddr), tx)
	submissionUC := submissionusecase.New(submissionRepo, judgeUC)
	clientUC := clientusecase.New(clientpostgres.New(db))
	return &container{authUC: authUC, userUC: userUC, questionUC: questionUC, paperUC: paperUC, examUC: examUC, submissionUC: submissionUC, judgeUC: judgeUC, clientUC: clientUC}
}

func buildRouter(c *container) *gin.Engine {
	router := gin.New()
	router.Use(gin.Recovery(), cors.Default(), middleware.RequestID())
	router.GET("/health", health)
	router.GET("/api/health", health)
	authMW := middleware.Authenticator(c.authUC)
	authhttp.RegisterRoutes(router, authMW)
	admin := router.Group("/api/admin", authMW, middleware.RequireAdmin())
	userhttp.RegisterRoutes(admin, c.userUC)
	questionhttp.RegisterRoutes(admin, c.questionUC)
	paperhttp.RegisterRoutes(admin, c.paperUC)
	examhttp.RegisterRoutes(admin, c.examUC)
	judgehttp.RegisterRoutes(admin, c.judgeUC)
	client := router.Group("/api/client", authMW, middleware.RequireClient())
	submissionhttp.RegisterRoutes(client, c.submissionUC)
	clienthttp.RegisterRoutes(client, c.clientUC)
	return router
}

func health(c *gin.Context) {
	response.Success(c, gin.H{"service": "examora-api", "status": "ok", "time": time.Now().UTC()})
}

func ShutdownContext() context.Context {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return ctx
}

func executeSandbox(parent context.Context, req judgeusecase.SandboxRunRequest) judgeusecase.SandboxRunResult {
	limit := time.Duration(req.TimeLimitMS)
	if limit <= 0 {
		limit = 2000
	}
	ctx, cancel := context.WithTimeout(parent, limit*time.Millisecond)
	defer cancel()

	dir, err := os.MkdirTemp("", "examora-sandbox-*")
	if err != nil {
		return judgeusecase.SandboxRunResult{Status: "SYSTEM_ERROR", Stderr: err.Error()}
	}
	defer os.RemoveAll(dir)

	cmd, err := sandboxCommand(ctx, dir, req)
	if err != nil {
		return judgeusecase.SandboxRunResult{Status: "COMPILE_ERROR", Stderr: err.Error()}
	}
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	cmd.Stdin = strings.NewReader(req.Stdin)
	start := time.Now()
	err = cmd.Run()
	elapsed := time.Since(start).Milliseconds()
	if errors.Is(ctx.Err(), context.DeadlineExceeded) {
		return judgeusecase.SandboxRunResult{Status: "TIME_LIMIT_EXCEEDED", Stdout: stdout.String(), Stderr: stderr.String(), TimeMS: elapsed}
	}
	if err != nil {
		exitCode := 1
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) {
			exitCode = exitErr.ExitCode()
		}
		return judgeusecase.SandboxRunResult{Status: "RUNTIME_ERROR", Stdout: stdout.String(), Stderr: stderr.String(), ExitCode: exitCode, TimeMS: elapsed}
	}
	return judgeusecase.SandboxRunResult{Status: "ACCEPTED", Stdout: stdout.String(), Stderr: stderr.String(), ExitCode: 0, TimeMS: elapsed}
}

func sandboxCommand(ctx context.Context, dir string, req judgeusecase.SandboxRunRequest) (*exec.Cmd, error) {
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
