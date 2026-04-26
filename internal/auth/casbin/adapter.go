package casbin

import (
	"fmt"

	"github.com/casbin/casbin/v2"
	"github.com/casbin/casbin/v2/model"
	gormadapter "github.com/casbin/gorm-adapter/v3"
	"gorm.io/gorm"
)

func NewEnforcer(db *gorm.DB) (*casbin.Enforcer, error) {
	adapter, err := gormadapter.NewAdapterByDB(db)
	if err != nil {
		return nil, fmt.Errorf("casbin adapter: %w", err)
	}

	modelText := `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
`

	m, err := model.NewModelFromString(modelText)
	if err != nil {
		return nil, fmt.Errorf("casbin model: %w", err)
	}

	return casbin.NewEnforcer(m, adapter)
}

func Enforce(e *casbin.Enforcer, subject string, object string, action string) (bool, error) {
	return e.Enforce(subject, object, action)
}

func GetRolesForUser(e *casbin.Enforcer, userID uint64) ([]string, error) {
	return e.GetRolesForUser(fmt.Sprintf("%d", userID))
}

func GetPermissionsForUser(e *casbin.Enforcer, userID uint64) ([][]string, error) {
	return e.GetPermissionsForUser(fmt.Sprintf("%d", userID))
}

func AddRoleForUser(e *casbin.Enforcer, userID uint64, role string) (bool, error) {
	return e.AddGroupingPolicy(fmt.Sprintf("%d", userID), role)
}

func AddPolicy(e *casbin.Enforcer, subject string, object string, action string) (bool, error) {
	return e.AddPolicy(subject, object, action)
}

func SeedPolicies(e *casbin.Enforcer) error {
	adminPolicies := [][]string{
		{"admin", "admin_dashboard", "write"},
		{"admin", "admin_dashboard", "read"},
		{"admin", "admin_dashboard", "delete"},
		{"admin", "questions", "write"},
		{"admin", "questions", "read"},
		{"admin", "questions", "delete"},
		{"admin", "papers", "write"},
		{"admin", "papers", "read"},
		{"admin", "papers", "delete"},
		{"admin", "exams", "write"},
		{"admin", "exams", "read"},
		{"admin", "exams", "delete"},
		{"admin", "submissions", "read"},
		{"admin", "judge_tasks", "write"},
		{"admin", "judge_tasks", "read"},
		{"admin", "client_events", "write"},
		{"admin", "client_events", "read"},
	}
	for _, p := range adminPolicies {
		if _, err := e.AddPolicy(p[0], p[1], p[2]); err != nil {
			return fmt.Errorf("add admin policy %v: %w", p, err)
		}
	}

	clientPolicies := [][]string{
		{"client", "client", "access"},
		{"client", "submissions", "read"},
		{"client", "client_events", "read"},
	}
	for _, p := range clientPolicies {
		if _, err := e.AddPolicy(p[0], p[1], p[2]); err != nil {
			return fmt.Errorf("add client policy %v: %w", p, err)
		}
	}

	return nil
}
