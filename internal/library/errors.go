package library

import "errors"

var (
	ErrPaperNotFound       = errors.New("paper not found")
	ErrQuestionNotFound    = errors.New("question not found")
	ErrInvalidPaper        = errors.New("invalid paper")
	ErrQuestionReferenced  = errors.New("question is referenced by papers")
	ErrPaperQuestionExists = errors.New("paper question already exists")
	ErrInvalidQuestion     = errors.New("invalid question")
)

func IsNotFound(err error) bool {
	return errors.Is(err, ErrPaperNotFound) ||
		errors.Is(err, ErrQuestionNotFound)
}

func IsConflict(err error) bool {
	return errors.Is(err, ErrQuestionReferenced) ||
		errors.Is(err, ErrPaperQuestionExists)
}

func IsValidation(err error) bool {
	return errors.Is(err, ErrInvalidQuestion) ||
		errors.Is(err, ErrInvalidPaper)
}
