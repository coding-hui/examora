package store

import (
	"context"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/infra/database"
)

func (s *Store) CreateSubmission(ctx context.Context, sub *exam.Submission) error {
	row := toSubmissionModel(sub)
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	*sub = *toSubmission(row)
	return nil
}

func (s *Store) GetSubmission(ctx context.Context, id uint64) (*exam.Submission, error) {
	var row database.SubmissionModel
	if err := s.db(ctx).First(&row, "id = ?", id).Error; err != nil {
		return nil, database.MapNotFound(err, exam.ErrSubmissionNotFound)
	}
	return toSubmission(&row), nil
}

func (s *Store) UpdateSubmissionStatus(ctx context.Context, id uint64, status string) error {
	return s.db(ctx).Model(&database.SubmissionModel{}).Where("id = ?", id).Update("status", status).Error
}
