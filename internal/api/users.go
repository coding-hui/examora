package api

import (
	"fmt"

	"github.com/casbin/casbin/v2"
	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/auth"
	authcasbin "github.com/coding-hui/examora/internal/auth/casbin"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

// region Request/Response types

type createUserRequest struct {
	Username    string  `json:"username"`
	DisplayName *string `json:"display_name"`
	Email       *string `json:"email"`
	Role        string  `json:"role"`
	Status      string  `json:"status"`
	Password    string  `json:"password"`
}

type updateUserRequest struct {
	Username    *string `json:"username"`
	DisplayName *string `json:"display_name"`
	Email       *string `json:"email"`
	Role        *string `json:"role"`
	Status      *string `json:"status"`
}

type userResponse struct {
	ID          uint64  `json:"id"`
	Username    string  `json:"username"`
	DisplayName *string `json:"display_name,omitempty"`
	Email       *string `json:"email,omitempty"`
	Role        string  `json:"role"`
	Status      string  `json:"status"`
	CreatedAt   string  `json:"created_at"`
}

// endregion

func (s *Server) registerUserAdminRoutes(admin *gin.RouterGroup) {
	admin.GET("/users", s.listUsers)
	admin.POST("/users", s.createUser)
	admin.PUT("/users/:id", s.updateUser)
	admin.DELETE("/users/:id", s.deleteUser)
}

func (s *Server) listUsers(c *gin.Context) {
	pageNum, pageSize := pageQuery(c)
	items, total, err := s.auth.ListUsers(c.Request.Context(), pageNum, pageSize)
	if err != nil {
		writeError(c, err)
		return
	}
	users := make([]userResponse, 0, len(items))
	for _, u := range items {
		users = append(users, toUserResponse(s.auth.Casbin(), u))
	}
	response.PageSuccess(c, users, total, pageNum, pageSize)
}

func (s *Server) createUser(c *gin.Context) {
	var req createUserRequest
	if !bindJSONAndCheck(c, &req) {
		return
	}

	if req.Username == "" {
		response.BadRequest(c, "username is required")
		return
	}
	if req.Role == "" {
		req.Role = "user"
	}
	if req.Status == "" {
		req.Status = "ACTIVE"
	}

	user := &auth.User{
		Username:    req.Username,
		DisplayName: req.DisplayName,
		Email:       req.Email,
		Role:        req.Role,
		Status:      req.Status,
	}

	password := req.Password
	if password == "" {
		password = "123456" // default password for local users
	}

	if err := s.auth.CreateUser(c.Request.Context(), user, password); err != nil {
		writeError(c, err)
		return
	}

	// Assign role via casbin
	if req.Role != "" && req.Role != "user" {
		_, _ = authcasbin.AddRoleForUser(s.auth.Casbin(), user.ID, req.Role)
	} else {
		_, _ = authcasbin.AddRoleForUser(s.auth.Casbin(), user.ID, "user")
	}

	response.Created(c, toUserResponse(s.auth.Casbin(), *user))
}

func (s *Server) updateUser(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}

	var req updateUserRequest
	if !bindJSONAndCheck(c, &req) {
		return
	}

	user, err := s.auth.GetUser(c.Request.Context(), id)
	if err != nil {
		writeError(c, err)
		return
	}

	if req.Username != nil {
		user.Username = *req.Username
	}
	if req.DisplayName != nil {
		user.DisplayName = req.DisplayName
	}
	if req.Email != nil {
		user.Email = req.Email
	}
	if req.Status != nil {
		user.Status = *req.Status
	}

	if err := s.auth.UpdateUser(c.Request.Context(), user); err != nil {
		writeError(c, err)
		return
	}

	// Update role via casbin if changed
	if req.Role != nil && *req.Role != "" {
		// Remove all existing roles and add the new one
		existingRoles, _ := authcasbin.GetRolesForUser(s.auth.Casbin(), id)
		for _, role := range existingRoles {
			_, _ = s.auth.Casbin().DeleteRoleForUser(fmt.Sprintf("%d", id), role)
		}
		_, _ = authcasbin.AddRoleForUser(s.auth.Casbin(), id, *req.Role)
		user.Role = *req.Role
	}

	response.Success(c, toUserResponse(s.auth.Casbin(), *user))
}

func (s *Server) deleteUser(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}

	if err := s.auth.DeleteUser(c.Request.Context(), id); err != nil {
		writeError(c, err)
		return
	}

	// Clean up casbin roles
	existingRoles, _ := authcasbin.GetRolesForUser(s.auth.Casbin(), id)
	for _, role := range existingRoles {
		_, _ = s.auth.Casbin().DeleteRoleForUser(fmt.Sprintf("%d", id), role)
	}

	response.NoContent(c)
}

func toUserResponse(casbinEnforcer *casbin.Enforcer, u auth.User) userResponse {
	role := u.Role
	if role == "" {
		roles, _ := authcasbin.GetRolesForUser(casbinEnforcer, u.ID)
		if len(roles) > 0 {
			role = roles[0]
		}
	}
	return userResponse{
		ID:          u.ID,
		Username:    u.Username,
		DisplayName: u.DisplayName,
		Email:       u.Email,
		Role:        role,
		Status:      u.Status,
		CreatedAt:   u.CreatedAt,
	}
}
