package entity

import (
	"errors"
	"time"
)

var ErrUserNotFound = errors.New("user not found")

const (
	RoleSuperAdmin = "SUPER_ADMIN"
	RoleTeacher    = "TEACHER"
	RoleProctor    = "PROCTOR"
	RoleStudent    = "STUDENT"

	StatusActive   = "ACTIVE"
	StatusDisabled = "DISABLED"
	StatusPending  = "PENDING"
)

type User struct {
	ID              uint64
	Username        string
	Email           *string
	ExternalSubject string
	AuthProvider    string
	DisplayName     *string
	RoleCode        *string
	Status          string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}
