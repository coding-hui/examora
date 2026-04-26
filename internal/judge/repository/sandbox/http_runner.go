package sandbox

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/coding-hui/examora/internal/judge/usecase"
)

type Runner struct {
	addr string
	http *http.Client
}

func New(addr string) *Runner {
	return &Runner{addr: strings.TrimRight(addr, "/"), http: &http.Client{Timeout: 30 * time.Second}}
}

func (r *Runner) Run(ctx context.Context, req usecase.SandboxRunRequest) (*usecase.SandboxRunResult, error) {
	body, _ := json.Marshal(req)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, r.addr+"/run", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	resp, err := r.http.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var result usecase.SandboxRunResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}
