package exam

import (
	"gorm.io/gorm"

	"github.com/coding-hui/examora/internal/library"
)

type Service struct {
	store  Store
	papers library.PaperReader
	judge  JudgeDispatcher
	db     *gorm.DB
}

func ProvideService(store Store, papers library.PaperReader, judge JudgeDispatcher, db *gorm.DB) (*Service, error) {
	return &Service{store: store, papers: papers, judge: judge, db: db}, nil
}
