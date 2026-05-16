package exam

import "errors"

var (
	ErrForbidden                   = errors.New("submission does not belong to current user")
	ErrExamNotFound                = errors.New("exam not found")
	ErrSubmissionNotFound          = errors.New("submission not found")
	ErrQuestionResultNotFound      = errors.New("question result not found")
	ErrInvalidExamStatusTransition = errors.New("invalid exam status transition")
	ErrSnapshotNotFound            = errors.New("snapshot not found")
	ErrSessionNotFound             = errors.New("exam session not found")
	ErrNotEligible                 = errors.New("not eligible for this exam")
	ErrExamNotStarted              = errors.New("exam has not started yet")
	ErrExamEnded                   = errors.New("exam has ended")
	ErrInvalidExamWindow           = errors.New("invalid exam time window")
	ErrUserGroupNotFound           = errors.New("user group not found")
	ErrInvalidUserGroup            = errors.New("invalid user group")
	ErrExamAssignmentNotFound      = errors.New("exam assignment not found")
	ErrInvalidExamAssignment       = errors.New("invalid exam assignment")
)

func IsNotFound(err error) bool {
	return errors.Is(err, ErrExamNotFound) ||
		errors.Is(err, ErrSubmissionNotFound) ||
		errors.Is(err, ErrQuestionResultNotFound) ||
		errors.Is(err, ErrSnapshotNotFound) ||
		errors.Is(err, ErrSessionNotFound) ||
		errors.Is(err, ErrUserGroupNotFound) ||
		errors.Is(err, ErrExamAssignmentNotFound)
}

func IsConflict(err error) bool {
	return errors.Is(err, ErrInvalidExamStatusTransition) ||
		errors.Is(err, ErrInvalidExamAssignment)
}

func IsForbidden(err error) bool {
	return errors.Is(err, ErrForbidden) ||
		errors.Is(err, ErrNotEligible) ||
		errors.Is(err, ErrExamNotStarted) ||
		errors.Is(err, ErrExamEnded)
}

func IsValidation(err error) bool {
	return errors.Is(err, ErrInvalidExamWindow) ||
		errors.Is(err, ErrInvalidUserGroup)
}
