package library

import (
	"context"

	"github.com/coding-hui/examora/internal/infra/transaction"
)

type Service struct {
	store Store
	tx    *transaction.Manager
}

func ProvideService(store Store, tx *transaction.Manager) (*Service, error) {
	return &Service{store: store, tx: tx}, nil
}

func (s *Service) withTx(ctx context.Context, fn func(ctx context.Context) error) error {
	if s.tx == nil {
		return fn(ctx)
	}
	return s.tx.WithTx(ctx, fn)
}
