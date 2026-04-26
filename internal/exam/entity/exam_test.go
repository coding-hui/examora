package entity

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestExamPublish(t *testing.T) {
	exam := &Exam{Status: StatusDraft, PaperID: 1}

	err := exam.Publish()

	require.NoError(t, err)
	require.Equal(t, StatusPublished, exam.Status)
}

func TestExamPublishRejectsInvalidTransition(t *testing.T) {
	exam := &Exam{Status: StatusClosed, PaperID: 1}

	err := exam.Publish()

	require.ErrorIs(t, err, ErrInvalidStatusTransition)
}

func TestExamClose(t *testing.T) {
	for _, status := range []string{StatusPublished, StatusRunning} {
		exam := &Exam{Status: status}

		err := exam.Close()

		require.NoError(t, err)
		require.Equal(t, StatusClosed, exam.Status)
	}
}
