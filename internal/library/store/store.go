package store

import (
	"context"

	"gorm.io/gorm"

	"github.com/coding-hui/examora/internal/infra/transaction"
	"github.com/coding-hui/examora/internal/library"
)

var (
	_ library.Store          = (*Store)(nil)
	_ library.PaperReader    = (*Store)(nil)
	_ library.TestCaseReader = (*Store)(nil)
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
