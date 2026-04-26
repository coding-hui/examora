package library

import "errors"

var (
	ErrPaperNotFound    = errors.New("paper not found")
	ErrQuestionNotFound = errors.New("question not found")
)

func IsNotFound(err error) bool {
	return errors.Is(err, ErrPaperNotFound) ||
		errors.Is(err, ErrQuestionNotFound)
}
