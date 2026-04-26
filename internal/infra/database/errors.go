package database

import (
	"errors"

	"gorm.io/gorm"
)

func MapNotFound(err error, target error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return target
	}
	return err
}
