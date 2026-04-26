package store

import (
	"context"

	"gorm.io/gorm"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/infra/transaction"
)

var (
	_ exam.Store            = (*Store)(nil)
	_ exam.SubmissionReader = (*Store)(nil)
)

type Store struct {
	conn *gorm.DB
}

func New(db *gorm.DB) *Store {
	return &Store{conn: db}
}

func (s *Store) db(ctx context.Context) *gorm.DB {
	return transaction.DBFromContext(ctx, s.conn)
}
