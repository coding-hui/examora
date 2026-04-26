package queue

import (
	"context"
	"encoding/json"

	"github.com/hibiken/asynq"

	"github.com/coding-hui/examora/internal/judge"
)

const TypeJudgeSubmission = "judge:submission"

type Queue struct {
	client *asynq.Client
}

func New(client *asynq.Client) *Queue {
	return &Queue{client: client}
}

func (q *Queue) EnqueueJudgeTask(ctx context.Context, payload judge.TaskPayload) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	_, err = q.client.EnqueueContext(ctx, asynq.NewTask(TypeJudgeSubmission, body), asynq.Queue("judge"), asynq.MaxRetry(3))
	return err
}
