package worker

import (
	"context"
	"encoding/json"

	"github.com/hibiken/asynq"

	"github.com/coding-hui/examora/internal/judge"
	"github.com/coding-hui/examora/internal/judge/queue"
)

type Handler struct {
	judge *judge.Service
}

func New(judgeSvc *judge.Service) *Handler {
	return &Handler{judge: judgeSvc}
}

func (h *Handler) Register(mux *asynq.ServeMux) {
	mux.HandleFunc(queue.TypeJudgeSubmission, h.HandleJudgeSubmission)
}

func (h *Handler) HandleJudgeSubmission(ctx context.Context, task *asynq.Task) error {
	var payload judge.TaskPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return err
	}
	return h.judge.ProcessTask(ctx, payload)
}
