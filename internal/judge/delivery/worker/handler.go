package worker

import (
	"context"
	"encoding/json"

	"github.com/hibiken/asynq"

	"github.com/coding-hui/examora/internal/judge/repository/queue"
	"github.com/coding-hui/examora/internal/judge/usecase"
)

type Handler struct{ uc *usecase.Usecase }

func New(uc *usecase.Usecase) *Handler { return &Handler{uc: uc} }
func (h *Handler) Register(mux *asynq.ServeMux) {
	mux.HandleFunc(queue.TypeJudgeSubmission, h.HandleJudgeSubmission)
}
func (h *Handler) HandleJudgeSubmission(ctx context.Context, task *asynq.Task) error {
	var payload usecase.JudgeTaskPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return err
	}
	return h.uc.ProcessTask(ctx, payload)
}
