package exam

import "errors"

var (
	ErrForbidden                   = errors.New("submission does not belong to current user")
	ErrExamNotFound                = errors.New("exam not found")
	ErrSubmissionNotFound          = errors.New("submission not found")
	ErrInvalidExamStatusTransition = errors.New("invalid exam status transition")
	ErrSnapshotNotFound            = errors.New("snapshot not found")
	ErrSessionNotFound             = errors.New("exam session not found")
	ErrNotEligible                 = errors.New("not eligible for this exam")
	ErrExamNotStarted              = errors.New("exam has not started yet")
	ErrExamEnded                   = errors.New("exam has ended")
	ErrInvalidExamWindow           = errors.New("invalid exam time window")
)

func IsNotFound(err error) bool {
	return errors.Is(err, ErrExamNotFound) ||
		errors.Is(err, ErrSubmissionNotFound) ||
		errors.Is(err, ErrSnapshotNotFound) ||
		errors.Is(err, ErrSessionNotFound)
}

func IsConflict(err error) bool {
	return errors.Is(err, ErrInvalidExamStatusTransition)
}

func IsForbidden(err error) bool {
	return errors.Is(err, ErrForbidden) ||
		errors.Is(err, ErrNotEligible) ||
		errors.Is(err, ErrExamNotStarted) ||
		errors.Is(err, ErrExamEnded)
}

func IsValidation(err error) bool {
	return errors.Is(err, ErrInvalidExamWindow)
}
