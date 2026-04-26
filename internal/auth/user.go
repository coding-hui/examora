package auth

import "errors"

var ErrUserNotFound = errors.New("user not found")

type User struct {
	ID              uint64  `json:"id"`
	Username        string  `json:"username"`
	Status          string  `json:"status"`
	DisplayName     *string `json:"display_name,omitempty"`
	AuthProvider    *string `json:"auth_provider,omitempty"`
	ExternalSubject *string `json:"external_subject,omitempty"`
}

type AuthenticatedUser struct {
	ID              uint64   `json:"id"`
	Username        string   `json:"username"`
	Roles           []string `json:"roles,omitempty"`
	Scopes          []string `json:"scopes,omitempty"`
	DisplayName     *string  `json:"display_name,omitempty"`
	ExternalSubject *string  `json:"external_subject,omitempty"`
}
