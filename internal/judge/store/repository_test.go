package store_test

import (
	"context"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/judge"
	judgestore "github.com/coding-hui/examora/internal/judge/store"
)

func TestFindByIDMapsMissingTaskToDomainNotFound(t *testing.T) {
	db, err := database.Open(filepath.Join(t.TempDir(), "examora-test.db"))
	require.NoError(t, err)
	require.NoError(t, database.AutoMigrate(db))

	store := judgestore.New(db)

	task, err := store.FindByID(context.Background(), 999999)

	require.Nil(t, task)
	require.ErrorIs(t, err, judge.ErrTaskNotFound)
}
