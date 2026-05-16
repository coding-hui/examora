package api

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/transport/http/response"
)

func (s *Server) registerUserGroupAdminRoutes(admin *gin.RouterGroup) {
	admin.GET("/user-groups", s.listUserGroups)
	admin.GET("/user-groups/tree", s.listUserGroupTree)
	admin.POST("/user-groups", s.createUserGroup)
	admin.GET("/user-groups/:id", s.getUserGroup)
	admin.PUT("/user-groups/:id", s.updateUserGroup)
	admin.DELETE("/user-groups/:id", s.deleteUserGroup)
	admin.GET("/user-groups/:id/children", s.listUserGroupChildren)
	admin.GET("/user-groups/:id/exam-assignments", s.listUserGroupExamAssignments)
	admin.GET("/user-groups/:id/students", s.listUserGroupStudents)
	admin.GET("/user-groups/:id/members", s.listUserGroupMembers)
	admin.POST("/user-groups/:id/members", s.addUserGroupMembers)
	admin.DELETE("/user-groups/:id/members/:user_id", s.removeUserGroupMember)
}

func (s *Server) listUserGroups(c *gin.Context) {
	pageNum, pageSize := pageQuery(c)
	keyword := strings.TrimSpace(c.Query("keyword"))
	parentIDText := strings.TrimSpace(c.Query("parent_id"))
	source := strings.TrimSpace(c.Query("source"))
	groups, err := s.exam.ListUserGroups(c.Request.Context())
	if err != nil {
		writeError(c, err)
		return
	}
	childCounts := make(map[uint64]int)
	for _, group := range groups {
		if group.ParentID != nil {
			childCounts[*group.ParentID]++
		}
	}
	items := make([]userGroupResponse, 0, len(groups))
	for _, group := range groups {
		if keyword != "" && !strings.Contains(strings.ToLower(group.Name+" "+group.Description), strings.ToLower(keyword)) {
			continue
		}
		if source != "" && group.Source != source {
			continue
		}
		if parentIDText != "" {
			if parentIDText == "root" {
				if group.ParentID != nil {
					continue
				}
			} else {
				parentID, err := strconv.ParseUint(parentIDText, 10, 64)
				if err != nil || group.ParentID == nil || *group.ParentID != parentID {
					continue
				}
			}
		}
		item := toUserGroupResponse(group)
		item.ChildCount = childCounts[group.ID]
		if ids, err := s.exam.ListUserGroupStudentIDs(c.Request.Context(), group.ID, false); err == nil {
			item.MemberCount = len(ids)
		}
		items = append(items, item)
	}
	total := int64(len(items))
	start, end := pageSlice(pageNum, pageSize, len(items))
	response.PageSuccess(c, items[start:end], total, pageNum, pageSize)
}

func (s *Server) listUserGroupTree(c *gin.Context) {
	tree, err := s.exam.ListUserGroupTree(c.Request.Context())
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, map[string]any{"items": userGroupTreeToResponses(tree)})
}

func (s *Server) getUserGroup(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	group, err := s.exam.GetUserGroup(c.Request.Context(), id)
	if err != nil {
		writeError(c, err)
		return
	}
	item := toUserGroupResponse(*group)
	if ids, err := s.exam.ListUserGroupStudentIDs(c.Request.Context(), id, false); err == nil {
		item.MemberCount = len(ids)
	}
	if children, err := s.exam.ListChildUserGroups(c.Request.Context(), id); err == nil {
		item.ChildCount = len(children)
	}
	response.Success(c, item)
}

func (s *Server) createUserGroup(c *gin.Context) {
	req, ok := bindJSON[saveUserGroupRequest](c)
	if !ok {
		return
	}
	group, err := s.exam.CreateUserGroup(c.Request.Context(), req.command(currentUserID(c)))
	if err != nil {
		writeError(c, err)
		return
	}
	response.Created(c, toUserGroupResponse(*group))
}

func (s *Server) updateUserGroup(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	req, ok := bindJSON[saveUserGroupRequest](c)
	if !ok {
		return
	}
	group, err := s.exam.UpdateUserGroup(c.Request.Context(), id, req.command(currentUserID(c)))
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toUserGroupResponse(*group))
}

func (s *Server) deleteUserGroup(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	if err := s.exam.DeleteUserGroup(c.Request.Context(), id); err != nil {
		writeError(c, err)
		return
	}
	response.NoContent(c)
}

func (s *Server) listUserGroupStudents(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	includeChildren, _ := strconv.ParseBool(c.DefaultQuery("include_children", "true"))
	userIDs, err := s.exam.ListUserGroupStudentIDs(c.Request.Context(), id, includeChildren)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, map[string]any{"ids": userIDs})
}

func (s *Server) listUserGroupMembers(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	pageNum, pageSize := pageQuery(c)
	includeChildren, _ := strconv.ParseBool(c.DefaultQuery("include_children", "false"))
	keyword := strings.ToLower(strings.TrimSpace(c.Query("keyword")))
	memberships, err := s.exam.ListUserGroupMemberships(c.Request.Context(), id, includeChildren)
	if err != nil {
		writeError(c, err)
		return
	}
	items := make([]userGroupMemberResponse, 0, len(memberships))
	for _, membership := range memberships {
		user, err := s.auth.GetUser(c.Request.Context(), membership.UserID)
		if err != nil {
			continue
		}
		userItem := toUserResponse(s.auth.Casbin(), *user)
		if keyword != "" && !userMatchesKeyword(userItem, keyword) {
			continue
		}
		items = append(items, userGroupMemberResponse{
			User:        userItem,
			UserGroupID: membership.UserGroupID,
			Direct:      membership.UserGroupID == id,
			Source:      membership.Source,
			CreatedAt:   membership.CreatedAt,
		})
	}
	total := int64(len(items))
	start, end := pageSlice(pageNum, pageSize, len(items))
	response.PageSuccess(c, items[start:end], total, pageNum, pageSize)
}

func (s *Server) listUserGroupChildren(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	groups, err := s.exam.ListChildUserGroups(c.Request.Context(), id)
	if err != nil {
		writeError(c, err)
		return
	}
	items := make([]userGroupResponse, 0, len(groups))
	for _, group := range groups {
		item := toUserGroupResponse(group)
		if ids, err := s.exam.ListUserGroupStudentIDs(c.Request.Context(), group.ID, false); err == nil {
			item.MemberCount = len(ids)
		}
		items = append(items, item)
	}
	response.Success(c, map[string]any{"items": items})
}

func (s *Server) listUserGroupExamAssignments(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	assignments, err := s.exam.ListUserGroupExamAssignments(c.Request.Context(), id)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, map[string]any{"items": examAssignmentsToResponses(assignments)})
}

func (s *Server) addUserGroupMembers(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	req, ok := bindJSON[batchIDsRequest](c)
	if !ok {
		return
	}
	if len(normalizeBatchIDs(req.IDs)) == 0 {
		response.BadRequest(c, "ids are required")
		return
	}
	if err := s.exam.AddUserGroupMembers(c.Request.Context(), id, req.IDs); err != nil {
		writeError(c, err)
		return
	}
	response.NoContent(c)
}

func (s *Server) removeUserGroupMember(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	userID, ok := parseUintParam(c, "user_id")
	if !ok {
		return
	}
	if err := s.exam.RemoveUserGroupMember(c.Request.Context(), id, userID); err != nil {
		writeError(c, err)
		return
	}
	response.NoContent(c)
}

func pageSlice(pageNum, pageSize, total int) (int, int) {
	if pageNum < 1 {
		pageNum = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	start := (pageNum - 1) * pageSize
	if start > total {
		start = total
	}
	end := start + pageSize
	if end > total {
		end = total
	}
	return start, end
}

func userMatchesKeyword(user userResponse, keyword string) bool {
	if strings.Contains(strings.ToLower(user.Username), keyword) {
		return true
	}
	if user.Email != nil && strings.Contains(strings.ToLower(*user.Email), keyword) {
		return true
	}
	if user.DisplayName != nil && strings.Contains(strings.ToLower(*user.DisplayName), keyword) {
		return true
	}
	return false
}
