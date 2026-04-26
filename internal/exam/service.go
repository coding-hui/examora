package exam

import "github.com/coding-hui/examora/internal/library"

type Service struct {
	store  Store
	papers library.PaperReader
	judge  JudgeDispatcher
}

func ProvideService(store Store, papers library.PaperReader, judge JudgeDispatcher) (*Service, error) {
	return &Service{store: store, papers: papers, judge: judge}, nil
}
