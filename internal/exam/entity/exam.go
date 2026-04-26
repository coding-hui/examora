package entity

import (
	"errors"
	"time"
)

const (
	StatusDraft     = "DRAFT"
	StatusPublished = "PUBLISHED"
	StatusRunning   = "RUNNING"
	StatusClosed    = "CLOSED"
	StatusArchived  = "ARCHIVED"
)

var ErrInvalidStatusTransition = errors.New("invalid exam status transition")

type Exam struct {
	ID              uint64     `json:"id"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	PaperID         uint64     `json:"paper_id"`
	Status          string     `json:"status"`
	StartTime       *time.Time `json:"start_time"`
	EndTime         *time.Time `json:"end_time"`
	DurationMinutes int        `json:"duration_minutes"`
	CreatedBy       uint64     `json:"created_by"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (e *Exam) Publish() error {
	if e.Status != StatusDraft {
		return ErrInvalidStatusTransition
	}
	e.Status = StatusPublished
	return nil
}

func (e *Exam) Close() error {
	if e.Status != StatusPublished && e.Status != StatusRunning {
		return ErrInvalidStatusTransition
	}
	e.Status = StatusClosed
	return nil
}
