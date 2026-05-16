package library

import (
	"context"
	"strings"
)

type BatchFailure struct {
	ID     uint64 `json:"id"`
	Reason string `json:"reason"`
}

type BatchResult struct {
	SuccessCount int            `json:"success_count"`
	FailedCount  int            `json:"failed_count"`
	Failures     []BatchFailure `json:"failures"`
}

func (r *BatchResult) recordSuccess() {
	r.SuccessCount++
}

func (r *BatchResult) recordFailure(id uint64, err error) {
	reason := "operation failed"
	if err != nil {
		reason = err.Error()
	}
	r.Failures = append(r.Failures, BatchFailure{ID: id, Reason: reason})
	r.FailedCount = len(r.Failures)
}

func (s *Service) BatchPatchQuestionStatus(ctx context.Context, ids []uint64, status string) BatchResult {
	result := BatchResult{Failures: []BatchFailure{}}
	status = strings.ToUpper(strings.TrimSpace(status))
	for _, id := range uniqueIDs(ids) {
		if _, err := s.PatchQuestionStatus(ctx, id, status); err != nil {
			result.recordFailure(id, err)
			continue
		}
		result.recordSuccess()
	}
	return result
}

func (s *Service) BatchDeleteQuestions(ctx context.Context, ids []uint64) BatchResult {
	result := BatchResult{Failures: []BatchFailure{}}
	for _, id := range uniqueIDs(ids) {
		if err := s.DeleteQuestion(ctx, id); err != nil {
			result.recordFailure(id, err)
			continue
		}
		result.recordSuccess()
	}
	return result
}

func (s *Service) BatchDeletePapers(ctx context.Context, ids []uint64) BatchResult {
	result := BatchResult{Failures: []BatchFailure{}}
	for _, id := range uniqueIDs(ids) {
		if err := s.DeletePaper(ctx, id); err != nil {
			result.recordFailure(id, err)
			continue
		}
		result.recordSuccess()
	}
	return result
}

func uniqueIDs(ids []uint64) []uint64 {
	seen := make(map[uint64]struct{}, len(ids))
	unique := make([]uint64, 0, len(ids))
	for _, id := range ids {
		if id == 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		unique = append(unique, id)
	}
	return unique
}
