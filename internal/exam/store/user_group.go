package store

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/infra/database"
)

func (s *Store) CreateUserGroup(ctx context.Context, group *exam.UserGroup) error {
	row := toUserGroupModel(group)
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	*group = *toUserGroup(row)
	return nil
}

func (s *Store) UpdateUserGroup(ctx context.Context, group *exam.UserGroup) error {
	return s.db(ctx).Model(&database.UserGroupModel{}).
		Where("id = ?", group.ID).
		Updates(map[string]any{
			"parent_id":   group.ParentID,
			"name":        group.Name,
			"description": group.Description,
			"status":      group.Status,
		}).Error
}

func (s *Store) DeleteUserGroup(ctx context.Context, id uint64) error {
	return s.db(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_group_id = ?", id).Delete(&database.UserGroupMemberModel{}).Error; err != nil {
			return err
		}
		return tx.Delete(&database.UserGroupModel{}, id).Error
	})
}

func (s *Store) GetUserGroup(ctx context.Context, id uint64) (*exam.UserGroup, error) {
	var row database.UserGroupModel
	if err := s.db(ctx).Where("id = ?", id).First(&row).Error; err != nil {
		return nil, database.MapNotFound(err, exam.ErrUserGroupNotFound)
	}
	return toUserGroup(&row), nil
}

func (s *Store) ListUserGroups(ctx context.Context) ([]exam.UserGroup, error) {
	var rows []database.UserGroupModel
	if err := s.db(ctx).Order("parent_id ASC, id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	groups := make([]exam.UserGroup, 0, len(rows))
	for _, row := range rows {
		groups = append(groups, *toUserGroup(&row))
	}
	return groups, nil
}

func (s *Store) ListDescendantUserGroupIDs(ctx context.Context, id uint64) ([]uint64, error) {
	groups, err := s.ListUserGroups(ctx)
	if err != nil {
		return nil, err
	}
	children := map[uint64][]uint64{}
	for _, group := range groups {
		if group.ParentID != nil {
			children[*group.ParentID] = append(children[*group.ParentID], group.ID)
		}
	}
	result := []uint64{}
	var walk func(uint64)
	walk = func(parentID uint64) {
		for _, childID := range children[parentID] {
			result = append(result, childID)
			walk(childID)
		}
	}
	walk(id)
	return result, nil
}

func (s *Store) AddUserGroupMembers(ctx context.Context, groupID uint64, userIDs []uint64) error {
	rows := make([]database.UserGroupMemberModel, 0, len(userIDs))
	for _, userID := range userIDs {
		if userID == 0 {
			continue
		}
		rows = append(rows, database.UserGroupMemberModel{
			UserGroupID: groupID,
			UserID:      userID,
			Source:      exam.UserGroupSourceLocal,
		})
	}
	if len(rows) == 0 {
		return nil
	}
	return s.db(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&rows).Error
}

func (s *Store) RemoveUserGroupMember(ctx context.Context, groupID, userID uint64) error {
	return s.db(ctx).
		Where("user_group_id = ? AND user_id = ?", groupID, userID).
		Delete(&database.UserGroupMemberModel{}).Error
}

func (s *Store) ListAllUserGroupMemberUserIDs(ctx context.Context) ([]uint64, error) {
	var ids []uint64
	if err := s.db(ctx).Model(&database.UserGroupMemberModel{}).Distinct("user_id").Order("user_id ASC").Pluck("user_id", &ids).Error; err != nil {
		return nil, err
	}
	return ids, nil
}

func (s *Store) ListUserGroupMemberUserIDs(ctx context.Context, groupIDs []uint64) ([]uint64, error) {
	if len(groupIDs) == 0 {
		return []uint64{}, nil
	}
	var ids []uint64
	if err := s.db(ctx).Model(&database.UserGroupMemberModel{}).
		Where("user_group_id IN ?", groupIDs).
		Distinct("user_id").
		Order("user_id ASC").
		Pluck("user_id", &ids).Error; err != nil {
		return nil, err
	}
	return ids, nil
}

func (s *Store) ListUserGroupMemberships(ctx context.Context, groupIDs []uint64) ([]exam.UserGroupMembership, error) {
	if len(groupIDs) == 0 {
		return []exam.UserGroupMembership{}, nil
	}
	var rows []database.UserGroupMemberModel
	if err := s.db(ctx).
		Where("user_group_id IN ?", groupIDs).
		Order("user_group_id ASC, user_id ASC").
		Find(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]exam.UserGroupMembership, 0, len(rows))
	seen := map[uint64]struct{}{}
	for _, row := range rows {
		if _, ok := seen[row.UserID]; ok {
			continue
		}
		seen[row.UserID] = struct{}{}
		items = append(items, exam.UserGroupMembership{
			UserGroupID: row.UserGroupID,
			UserID:      row.UserID,
			Source:      row.Source,
			CreatedAt:   row.CreatedAt,
		})
	}
	return items, nil
}

func (s *Store) ListUserGroupExamAssignments(ctx context.Context, groupID uint64) ([]exam.ExamAssignment, error) {
	var rows []database.ExamAssignmentModel
	if err := s.db(ctx).
		Where("target_type = ? AND target_id = ?", exam.ExamAssignmentTargetUserGroup, groupID).
		Order("id DESC").
		Find(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]exam.ExamAssignment, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toExamAssignment(&row))
	}
	return items, nil
}

func (s *Store) CreateExamAssignment(ctx context.Context, assignment *exam.ExamAssignment) error {
	row := toExamAssignmentModel(assignment)
	err := s.db(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(row).Error
	if err != nil {
		return err
	}
	if row.ID == 0 {
		var existing database.ExamAssignmentModel
		err = s.db(ctx).
			Where("exam_id = ? AND target_type = ? AND target_id = ?", assignment.ExamID, assignment.TargetType, assignment.TargetID).
			First(&existing).Error
		if err != nil {
			return err
		}
		row = &existing
	}
	*assignment = *toExamAssignment(row)
	return nil
}

func (s *Store) GetExamAssignment(ctx context.Context, examID, assignmentID uint64) (*exam.ExamAssignment, error) {
	var row database.ExamAssignmentModel
	if err := s.db(ctx).Where("exam_id = ? AND id = ?", examID, assignmentID).First(&row).Error; err != nil {
		return nil, database.MapNotFound(err, exam.ErrExamAssignmentNotFound)
	}
	return toExamAssignment(&row), nil
}

func (s *Store) ListExamAssignments(ctx context.Context, examID uint64) ([]exam.ExamAssignment, error) {
	var rows []database.ExamAssignmentModel
	if err := s.db(ctx).Where("exam_id = ?", examID).Order("id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]exam.ExamAssignment, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toExamAssignment(&row))
	}
	return items, nil
}

func (s *Store) DeleteExamAssignment(ctx context.Context, id uint64) error {
	err := s.db(ctx).Delete(&database.ExamAssignmentModel{}, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return exam.ErrExamAssignmentNotFound
	}
	return err
}

func toUserGroupModel(group *exam.UserGroup) *database.UserGroupModel {
	return &database.UserGroupModel{
		ID:               group.ID,
		ParentID:         group.ParentID,
		Name:             group.Name,
		Description:      group.Description,
		Status:           group.Status,
		Source:           group.Source,
		ExternalProvider: group.ExternalProvider,
		ExternalID:       group.ExternalID,
		ExternalParentID: group.ExternalParentID,
		SyncMode:         group.SyncMode,
		LastSyncedAt:     group.LastSyncedAt,
		CreatedBy:        group.CreatedBy,
	}
}

func toUserGroup(row *database.UserGroupModel) *exam.UserGroup {
	return &exam.UserGroup{
		ID:               row.ID,
		ParentID:         row.ParentID,
		Name:             row.Name,
		Description:      row.Description,
		Status:           row.Status,
		Source:           row.Source,
		ExternalProvider: row.ExternalProvider,
		ExternalID:       row.ExternalID,
		ExternalParentID: row.ExternalParentID,
		SyncMode:         row.SyncMode,
		LastSyncedAt:     row.LastSyncedAt,
		CreatedBy:        row.CreatedBy,
		CreatedAt:        row.CreatedAt,
		UpdatedAt:        row.UpdatedAt,
	}
}

func toExamAssignmentModel(assignment *exam.ExamAssignment) *database.ExamAssignmentModel {
	return &database.ExamAssignmentModel{
		ID:             assignment.ID,
		ExamID:         assignment.ExamID,
		ExamSnapshotID: assignment.ExamSnapshotID,
		TargetType:     assignment.TargetType,
		TargetID:       assignment.TargetID,
		CreatedBy:      assignment.CreatedBy,
	}
}

func toExamAssignment(row *database.ExamAssignmentModel) *exam.ExamAssignment {
	return &exam.ExamAssignment{
		ID:             row.ID,
		ExamID:         row.ExamID,
		ExamSnapshotID: row.ExamSnapshotID,
		TargetType:     row.TargetType,
		TargetID:       row.TargetID,
		CreatedBy:      row.CreatedBy,
		CreatedAt:      row.CreatedAt,
	}
}
