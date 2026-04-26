package entity

import "time"

const (
	ProviderLogto = "LOGTO"
	StatusActive  = "ACTIVE"
	StatusPending = "PENDING"
)

type User struct {
	ID              uint64
	ExternalSubject string
	AuthProvider    string
	DisplayName     *string
	Email           *string
	RoleCode        *string
	Status          string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (u *User) IsActive() bool {
	return u.Status == StatusActive
}

func (u *User) IsAdmin() bool {
	if u.RoleCode == nil {
		return false
	}
	switch *u.RoleCode {
	case "SUPER_ADMIN", "TEACHER", "PROCTOR":
		return true
	default:
		return false
	}
}

func (u *User) IsStudent() bool {
	return u.RoleCode != nil && *u.RoleCode == "STUDENT"
}
