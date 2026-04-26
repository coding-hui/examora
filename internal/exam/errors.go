package exam

import "errors"

var (
	ErrForbidden                   = errors.New("submission does not belong to current user")
	ErrExamNotFound                = errors.New("exam not found")
	ErrSubmissionNotFound          = errors.New("submission not found")
	ErrInvalidExamStatusTransition = errors.New("invalid exam status transition")
)

func IsNotFound(err error) bool {
	return errors.Is(err, ErrExamNotFound) ||
		errors.Is(err, ErrSubmissionNotFound)
}

func IsConflict(err error) bool {
	return errors.Is(err, ErrInvalidExamStatusTransition)
}
