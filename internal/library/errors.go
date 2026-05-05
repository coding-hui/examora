package library

import "errors"

var (
	ErrPaperNotFound      = errors.New("paper not found")
	ErrQuestionNotFound   = errors.New("question not found")
	ErrQuestionReferenced = errors.New("question is referenced by papers")
	ErrInvalidQuestion    = errors.New("invalid question")
)

func IsNotFound(err error) bool {
	return errors.Is(err, ErrPaperNotFound) ||
		errors.Is(err, ErrQuestionNotFound)
}

func IsConflict(err error) bool {
	return errors.Is(err, ErrQuestionReferenced)
}

func IsValidation(err error) bool {
	return errors.Is(err, ErrInvalidQuestion)
}
