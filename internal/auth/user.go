package auth

import "errors"

var ErrUserNotFound = errors.New("user not found")

type User struct {
	ID              uint64  `json:"id"`
	Username        string  `json:"username"`
	DisplayName     *string `json:"display_name,omitempty"`
	Email           *string `json:"email,omitempty"`
	Role            string  `json:"role"`
	Status          string  `json:"status"`
	AuthProvider    *string `json:"auth_provider,omitempty"`
	ExternalSubject *string `json:"external_subject,omitempty"`
	CreatedAt       string  `json:"created_at,omitempty"`
}

type AuthenticatedUser struct {
	ID              uint64   `json:"id"`
	Username        string   `json:"username"`
	Roles           []string `json:"roles,omitempty"`
	Scopes          []string `json:"scopes,omitempty"`
	DisplayName     *string  `json:"display_name,omitempty"`
	ExternalSubject *string  `json:"external_subject,omitempty"`
}
