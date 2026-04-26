package queue

import (
	"context"
	"encoding/json"

	"github.com/hibiken/asynq"

	"github.com/coding-hui/examora/internal/judge/usecase"
)

const TypeJudgeSubmission = "judge:submission"

type JudgeQueue struct{ client *asynq.Client }

func New(client *asynq.Client) *JudgeQueue { return &JudgeQueue{client: client} }
func (q *JudgeQueue) EnqueueJudgeTask(ctx context.Context, payload usecase.JudgeTaskPayload) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	_, err = q.client.EnqueueContext(ctx, asynq.NewTask(TypeJudgeSubmission, body), asynq.Queue("judge"), asynq.MaxRetry(3))
	return err
}
