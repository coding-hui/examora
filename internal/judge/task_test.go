package judge

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestJudgeTaskStatusFlow(t *testing.T) {
	task, err := NewTask(1, 2, 12345, "go")
	require.NoError(t, err)
	require.Equal(t, StatusPending, task.Status)

	require.NoError(t, task.MarkQueued())
	require.Equal(t, StatusQueued, task.Status)

	now := time.Now()
	require.NoError(t, task.MarkRunning(now))
	require.Equal(t, StatusRunning, task.Status)
	require.Equal(t, &now, task.StartedAt)

	finished := now.Add(time.Second)
	require.NoError(t, task.Complete(StatusAccepted, map[string]any{"passed_cases": 1}, nil, finished))
	require.Equal(t, StatusAccepted, task.Status)
	require.Equal(t, &finished, task.FinishedAt)
}

func TestJudgeTaskRejectsTerminalToRunning(t *testing.T) {
	task := &Task{Status: StatusAccepted}

	err := task.MarkRunning(time.Now())

	require.ErrorIs(t, err, ErrInvalidStatusTransition)
}
