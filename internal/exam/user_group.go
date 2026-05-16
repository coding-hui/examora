package exam

import (
	"context"
	"errors"
	"slices"
	"strings"
	"time"
)

const (
	UserGroupStatusActive   = "ACTIVE"
	UserGroupStatusArchived = "ARCHIVED"

	UserGroupSourceLocal = "LOCAL"
	UserGroupSyncLocal   = "LOCAL"

	ExamAssignmentTargetUser      = "USER"
	ExamAssignmentTargetUserGroup = "USER_GROUP"
)

type UserGroup struct {
	ID               uint64
	ParentID         *uint64
	Name             string
	Description      string
	Status           string
	Source           string
	ExternalProvider *string
	ExternalID       *string
	ExternalParentID *string
	SyncMode         string
	LastSyncedAt     *time.Time
	CreatedBy        uint64
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type UserGroupTreeNode struct {
	UserGroup
	Children []UserGroupTreeNode
}

type UserGroupMembership struct {
	UserGroupID uint64
	UserID      uint64
	Source      string
	CreatedAt   time.Time
}

type SaveUserGroupCommand struct {
	ParentID    *uint64
	Name        string
	Description string
	Status      string
	CreatedBy   uint64
}

type ExamAssignment struct {
	ID             uint64
	ExamID         uint64
	ExamSnapshotID uint64
	TargetType     string
	TargetID       uint64
	CreatedBy      uint64
	CreatedAt      time.Time
}

type AssignExamTargetsCommand struct {
	UserIDs      []uint64
	UserGroupIDs []uint64
	CreatedBy    uint64
}

func (s *Service) CreateUserGroup(ctx context.Context, cmd SaveUserGroupCommand) (*UserGroup, error) {
	name := strings.TrimSpace(cmd.Name)
	if name == "" {
		return nil, ErrInvalidUserGroup
	}
	status := cmd.Status
	if status == "" {
		status = UserGroupStatusActive
	}
	if cmd.ParentID != nil {
		if _, err := s.store.GetUserGroup(ctx, *cmd.ParentID); err != nil {
			return nil, err
		}
	}
	group := &UserGroup{
		ParentID:    cmd.ParentID,
		Name:        name,
		Description: strings.TrimSpace(cmd.Description),
		Status:      status,
		Source:      UserGroupSourceLocal,
		SyncMode:    UserGroupSyncLocal,
		CreatedBy:   cmd.CreatedBy,
	}
	if err := s.store.CreateUserGroup(ctx, group); err != nil {
		return nil, err
	}
	return group, nil
}

func (s *Service) UpdateUserGroup(ctx context.Context, id uint64, cmd SaveUserGroupCommand) (*UserGroup, error) {
	group, err := s.store.GetUserGroup(ctx, id)
	if err != nil {
		return nil, err
	}
	name := strings.TrimSpace(cmd.Name)
	if name == "" {
		return nil, ErrInvalidUserGroup
	}
	if cmd.ParentID != nil {
		if *cmd.ParentID == id {
			return nil, ErrInvalidUserGroup
		}
		descendants, err := s.store.ListDescendantUserGroupIDs(ctx, id)
		if err != nil {
			return nil, err
		}
		if slices.Contains(descendants, *cmd.ParentID) {
			return nil, ErrInvalidUserGroup
		}
		if _, err := s.store.GetUserGroup(ctx, *cmd.ParentID); err != nil {
			return nil, err
		}
	}
	status := cmd.Status
	if status == "" {
		status = group.Status
	}
	group.ParentID = cmd.ParentID
	group.Name = name
	group.Description = strings.TrimSpace(cmd.Description)
	group.Status = status
	if err := s.store.UpdateUserGroup(ctx, group); err != nil {
		return nil, err
	}
	return group, nil
}

func (s *Service) DeleteUserGroup(ctx context.Context, id uint64) error {
	descendants, err := s.store.ListDescendantUserGroupIDs(ctx, id)
	if err != nil {
		return err
	}
	if len(descendants) > 0 {
		return ErrInvalidUserGroup
	}
	return s.store.DeleteUserGroup(ctx, id)
}

func (s *Service) ListUserGroupTree(ctx context.Context) ([]UserGroupTreeNode, error) {
	groups, err := s.store.ListUserGroups(ctx)
	if err != nil {
		return nil, err
	}
	byParent := map[uint64][]UserGroup{}
	roots := []UserGroup{}
	for _, group := range groups {
		if group.ParentID == nil {
			roots = append(roots, group)
			continue
		}
		byParent[*group.ParentID] = append(byParent[*group.ParentID], group)
	}
	var build func(UserGroup) UserGroupTreeNode
	build = func(group UserGroup) UserGroupTreeNode {
		node := UserGroupTreeNode{UserGroup: group, Children: []UserGroupTreeNode{}}
		for _, child := range byParent[group.ID] {
			node.Children = append(node.Children, build(child))
		}
		return node
	}
	tree := make([]UserGroupTreeNode, 0, len(roots))
	for _, root := range roots {
		tree = append(tree, build(root))
	}
	return tree, nil
}

func (s *Service) GetUserGroup(ctx context.Context, id uint64) (*UserGroup, error) {
	return s.store.GetUserGroup(ctx, id)
}

func (s *Service) ListUserGroups(ctx context.Context) ([]UserGroup, error) {
	return s.store.ListUserGroups(ctx)
}

func (s *Service) ListChildUserGroups(ctx context.Context, parentID uint64) ([]UserGroup, error) {
	groups, err := s.store.ListUserGroups(ctx)
	if err != nil {
		return nil, err
	}
	children := make([]UserGroup, 0)
	for _, group := range groups {
		if group.ParentID != nil && *group.ParentID == parentID {
			children = append(children, group)
		}
	}
	return children, nil
}

func (s *Service) AddUserGroupMembers(ctx context.Context, groupID uint64, userIDs []uint64) error {
	if _, err := s.store.GetUserGroup(ctx, groupID); err != nil {
		return err
	}
	return s.store.AddUserGroupMembers(ctx, groupID, uniqueIDs(userIDs))
}

func (s *Service) RemoveUserGroupMember(ctx context.Context, groupID, userID uint64) error {
	return s.store.RemoveUserGroupMember(ctx, groupID, userID)
}

func (s *Service) ListUserGroupStudentIDs(ctx context.Context, groupID uint64, includeChildren bool) ([]uint64, error) {
	if groupID == 0 {
		return s.store.ListAllUserGroupMemberUserIDs(ctx)
	}
	groupIDs := []uint64{groupID}
	if includeChildren {
		descendantIDs, err := s.store.ListDescendantUserGroupIDs(ctx, groupID)
		if err != nil {
			return nil, err
		}
		groupIDs = append(groupIDs, descendantIDs...)
	}
	return s.store.ListUserGroupMemberUserIDs(ctx, groupIDs)
}

func (s *Service) ListUserGroupMemberships(ctx context.Context, groupID uint64, includeChildren bool) ([]UserGroupMembership, error) {
	if _, err := s.store.GetUserGroup(ctx, groupID); err != nil {
		return nil, err
	}
	groupIDs := []uint64{groupID}
	if includeChildren {
		descendantIDs, err := s.store.ListDescendantUserGroupIDs(ctx, groupID)
		if err != nil {
			return nil, err
		}
		groupIDs = append(groupIDs, descendantIDs...)
	}
	return s.store.ListUserGroupMemberships(ctx, groupIDs)
}

func (s *Service) ListUserGroupExamAssignments(ctx context.Context, groupID uint64) ([]ExamAssignment, error) {
	if _, err := s.store.GetUserGroup(ctx, groupID); err != nil {
		return nil, err
	}
	return s.store.ListUserGroupExamAssignments(ctx, groupID)
}

func (s *Service) ListExamAssignments(ctx context.Context, examID uint64) ([]ExamAssignment, error) {
	if _, err := s.store.GetExam(ctx, examID); err != nil {
		return nil, err
	}
	return s.store.ListExamAssignments(ctx, examID)
}

func (s *Service) AssignExamTargets(ctx context.Context, examID uint64, cmd AssignExamTargetsCommand) (BatchResult, error) {
	result := BatchResult{Failures: []BatchFailure{}}
	snapshot, err := s.store.GetExamSnapshotByExamID(ctx, examID)
	if err != nil {
		return result, err
	}

	targetUsers := uniqueIDs(cmd.UserIDs)
	for _, groupID := range uniqueIDs(cmd.UserGroupIDs) {
		groupUsers, err := s.ListUserGroupStudentIDs(ctx, groupID, true)
		if err != nil {
			result.recordFailure(groupID, err)
			continue
		}
		targetUsers = append(targetUsers, groupUsers...)
		assignment := &ExamAssignment{
			ExamID:         examID,
			ExamSnapshotID: snapshot.ID,
			TargetType:     ExamAssignmentTargetUserGroup,
			TargetID:       groupID,
			CreatedBy:      cmd.CreatedBy,
		}
		if err := s.store.CreateExamAssignment(ctx, assignment); err != nil {
			result.recordFailure(groupID, err)
		}
	}
	for _, userID := range uniqueIDs(cmd.UserIDs) {
		assignment := &ExamAssignment{
			ExamID:         examID,
			ExamSnapshotID: snapshot.ID,
			TargetType:     ExamAssignmentTargetUser,
			TargetID:       userID,
			CreatedBy:      cmd.CreatedBy,
		}
		if err := s.store.CreateExamAssignment(ctx, assignment); err != nil {
			result.recordFailure(userID, err)
		}
	}
	targetUsers = uniqueIDs(targetUsers)
	if len(targetUsers) == 0 {
		return result, nil
	}

	existing, err := s.store.ListExamSessionsBySnapshot(ctx, snapshot.ID)
	if err != nil {
		return result, err
	}
	existingUsers := make(map[uint64]struct{}, len(existing))
	for _, session := range existing {
		existingUsers[session.UserID] = struct{}{}
	}
	for _, userID := range targetUsers {
		if _, ok := existingUsers[userID]; ok {
			result.recordSuccess()
			continue
		}
		session := &ExamSession{
			ExamSnapshotID: snapshot.ID,
			UserID:         userID,
			Status:         SessionStatusNotStarted,
		}
		if err := s.store.CreateExamSession(ctx, session); err != nil {
			result.recordFailure(userID, err)
			continue
		}
		result.recordSuccess()
	}
	return result, nil
}

func (s *Service) RemoveExamAssignment(ctx context.Context, examID, assignmentID uint64) error {
	assignment, err := s.store.GetExamAssignment(ctx, examID, assignmentID)
	if err != nil {
		return err
	}
	var userIDs []uint64
	switch assignment.TargetType {
	case ExamAssignmentTargetUser:
		userIDs = []uint64{assignment.TargetID}
	case ExamAssignmentTargetUserGroup:
		userIDs, err = s.ListUserGroupStudentIDs(ctx, assignment.TargetID, true)
		if err != nil {
			return err
		}
	default:
		return ErrInvalidExamAssignment
	}
	sessions, err := s.store.ListExamSessionsBySnapshot(ctx, assignment.ExamSnapshotID)
	if err != nil {
		return err
	}
	sessionByUser := make(map[uint64]ExamSession, len(sessions))
	for _, session := range sessions {
		sessionByUser[session.UserID] = session
	}
	for _, userID := range uniqueIDs(userIDs) {
		session, ok := sessionByUser[userID]
		if !ok {
			continue
		}
		if session.Status != SessionStatusNotStarted {
			return errors.Join(ErrInvalidExamStatusTransition, ErrInvalidExamAssignment)
		}
	}
	for _, userID := range uniqueIDs(userIDs) {
		session, ok := sessionByUser[userID]
		if ok {
			if err := s.store.DeleteExamSession(ctx, session.ID); err != nil {
				return err
			}
		}
	}
	return s.store.DeleteExamAssignment(ctx, assignment.ID)
}
