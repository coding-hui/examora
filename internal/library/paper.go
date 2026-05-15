package library

import (
	"context"
	"fmt"
	"strings"
	"time"
)

const (
	PaperStatusDraft     = "DRAFT"
	PaperStatusPublished = "PUBLISHED"
)

type Paper struct {
	ID            uint64    `json:"id"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	Status        string    `json:"status"`
	CreatedBy     uint64    `json:"created_by"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	QuestionCount int       `json:"question_count"`
	TotalScore    float64   `json:"total_score"`
}

type PaperQuestion struct {
	ID         uint64    `json:"id"`
	PaperID    uint64    `json:"paper_id"`
	SectionID  uint64    `json:"section_id"`
	QuestionID uint64    `json:"question_id"`
	Score      float64   `json:"score"`
	SortOrder  int       `json:"sort_order"`
	CreatedAt  time.Time `json:"created_at"`
}

type PaperQuestionWithQuestion struct {
	PaperQuestion
	QuestionTitle      string  `json:"question_title"`
	QuestionType       string  `json:"question_type"`
	QuestionDifficulty *string `json:"question_difficulty,omitempty"`
	QuestionStatus     string  `json:"question_status"`
}

type PaperSection struct {
	ID            uint64                      `json:"id"`
	PaperID       uint64                      `json:"paper_id"`
	Title         string                      `json:"title"`
	Description   string                      `json:"description"`
	SortOrder     int                         `json:"sort_order"`
	QuestionCount int                         `json:"question_count"`
	TotalScore    float64                     `json:"total_score"`
	CreatedAt     time.Time                   `json:"created_at"`
	UpdatedAt     time.Time                   `json:"updated_at"`
	Questions     []PaperQuestionWithQuestion `json:"questions,omitempty"`
}

type PaperOutline struct {
	Paper         Paper          `json:"paper"`
	Sections      []PaperSection `json:"sections"`
	QuestionCount int            `json:"question_count"`
	TotalScore    float64        `json:"total_score"`
}

type SavePaperCommand struct {
	Title       string
	Description string
	Status      string
	CreatedBy   uint64
}

type PaperFilter struct {
	Keyword  string
	Status   string
	PageNum  int
	PageSize int
}

type AddPaperQuestionCommand struct {
	QuestionID uint64
	Score      float64
	SortOrder  int
}

type UpdatePaperQuestionCommand struct {
	Score     float64
	SortOrder int
}

type SavePaperSectionQuestionCommand struct {
	QuestionID uint64
	Score      float64
	SortOrder  int
}

type SavePaperSectionCommand struct {
	ID          uint64
	Title       string
	Description string
	SortOrder   int
	Questions   []SavePaperSectionQuestionCommand
}

type SavePaperOutlineCommand struct {
	Sections []SavePaperSectionCommand
}

func (s *Service) ListPapers(ctx context.Context, filter PaperFilter) ([]Paper, int64, error) {
	if filter.PageNum < 1 {
		filter.PageNum = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 20
	}
	if filter.PageSize > 100 {
		filter.PageSize = 100
	}
	return s.store.ListPapers(ctx, filter)
}

func (s *Service) GetPaper(ctx context.Context, id uint64) (*Paper, error) {
	return s.store.GetPaper(ctx, id)
}

func (s *Service) PaperExists(ctx context.Context, id uint64) (bool, error) {
	return s.store.PaperExists(ctx, id)
}

func (s *Service) DeletePaper(ctx context.Context, id uint64) error {
	return s.store.DeletePaper(ctx, id)
}

func (s *Service) CreatePaper(ctx context.Context, cmd SavePaperCommand) (*Paper, error) {
	if err := normalizeAndValidatePaperCommand(&cmd); err != nil {
		return nil, err
	}
	p := &Paper{Title: cmd.Title, Description: cmd.Description, Status: cmd.Status, CreatedBy: cmd.CreatedBy}
	if err := s.store.CreatePaper(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) UpdatePaper(ctx context.Context, id uint64, cmd SavePaperCommand) (*Paper, error) {
	if _, err := s.store.GetPaper(ctx, id); err != nil {
		return nil, err
	}
	if err := normalizeAndValidatePaperCommand(&cmd); err != nil {
		return nil, err
	}
	p := &Paper{ID: id, Title: cmd.Title, Description: cmd.Description, Status: cmd.Status, CreatedBy: cmd.CreatedBy}
	if err := s.store.UpdatePaper(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func normalizeAndValidatePaperCommand(cmd *SavePaperCommand) error {
	cmd.Title = strings.TrimSpace(cmd.Title)
	cmd.Description = strings.TrimSpace(cmd.Description)
	cmd.Status = strings.ToUpper(strings.TrimSpace(cmd.Status))
	if cmd.Status == "" {
		cmd.Status = PaperStatusDraft
	}
	if cmd.Title == "" {
		return fmt.Errorf("%w: paper title is required", ErrInvalidPaper)
	}
	if cmd.Status != PaperStatusDraft && cmd.Status != PaperStatusPublished {
		return fmt.Errorf("%w: unsupported paper status", ErrInvalidPaper)
	}
	return nil
}

func (s *Service) AddPaperQuestion(ctx context.Context, paperID uint64, cmd AddPaperQuestionCommand) (*PaperQuestion, error) {
	if _, err := s.store.GetPaper(ctx, paperID); err != nil {
		return nil, err
	}
	question, err := s.store.GetQuestion(ctx, cmd.QuestionID)
	if err != nil {
		return nil, err
	}
	if cmd.Score <= 0 {
		return nil, fmt.Errorf("%w: paper question score must be positive", ErrInvalidPaper)
	}
	if question.Status != QuestionStatusPublished {
		return nil, fmt.Errorf("%w: paper question must reference a published question", ErrInvalidPaper)
	}
	existing, err := s.store.ListPaperQuestions(ctx, paperID)
	if err != nil {
		return nil, err
	}
	sectionID, err := s.store.EnsureDefaultPaperSection(ctx, paperID)
	if err != nil {
		return nil, err
	}
	for _, item := range existing {
		if item.QuestionID == cmd.QuestionID {
			return nil, ErrPaperQuestionExists
		}
	}
	item := &PaperQuestion{PaperID: paperID, SectionID: sectionID, QuestionID: cmd.QuestionID, Score: cmd.Score, SortOrder: cmd.SortOrder}
	if err := s.store.AddPaperQuestion(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *Service) ListPaperQuestions(ctx context.Context, paperID uint64) ([]PaperQuestionWithQuestion, error) {
	if _, err := s.store.GetPaper(ctx, paperID); err != nil {
		return nil, err
	}
	return s.store.ListPaperQuestionsWithQuestion(ctx, paperID)
}

func (s *Service) GetPaperOutline(ctx context.Context, paperID uint64) (*PaperOutline, error) {
	return s.store.GetPaperOutline(ctx, paperID)
}

func (s *Service) SavePaperOutline(ctx context.Context, paperID uint64, cmd SavePaperOutlineCommand) (*PaperOutline, error) {
	if _, err := s.store.GetPaper(ctx, paperID); err != nil {
		return nil, err
	}
	seenQuestions := make(map[uint64]struct{})
	for _, section := range cmd.Sections {
		if strings.TrimSpace(section.Title) == "" {
			return nil, fmt.Errorf("%w: paper section title is required", ErrInvalidPaper)
		}
		for _, item := range section.Questions {
			if item.Score <= 0 {
				return nil, fmt.Errorf("%w: paper question score must be positive", ErrInvalidPaper)
			}
			if _, ok := seenQuestions[item.QuestionID]; ok {
				return nil, ErrPaperQuestionExists
			}
			seenQuestions[item.QuestionID] = struct{}{}
			question, err := s.store.GetQuestion(ctx, item.QuestionID)
			if err != nil {
				return nil, err
			}
			if question.Status != QuestionStatusPublished {
				return nil, fmt.Errorf("%w: paper question must reference a published question", ErrInvalidPaper)
			}
		}
	}
	if err := s.withTx(ctx, func(ctx context.Context) error {
		if err := s.store.DeletePaperQuestionsByPaper(ctx, paperID); err != nil {
			return err
		}
		if err := s.store.DeletePaperSectionsByPaper(ctx, paperID); err != nil {
			return err
		}
		for sectionIndex, section := range cmd.Sections {
			sectionRow := &PaperSection{
				PaperID:     paperID,
				Title:       strings.TrimSpace(section.Title),
				Description: strings.TrimSpace(section.Description),
				SortOrder:   section.SortOrder,
			}
			if sectionRow.SortOrder == 0 {
				sectionRow.SortOrder = sectionIndex + 1
			}
			if err := s.store.CreatePaperSection(ctx, sectionRow); err != nil {
				return err
			}
			for questionIndex, item := range section.Questions {
				row := &PaperQuestion{
					PaperID:    paperID,
					SectionID:  sectionRow.ID,
					QuestionID: item.QuestionID,
					Score:      item.Score,
					SortOrder:  item.SortOrder,
				}
				if row.SortOrder == 0 {
					row.SortOrder = questionIndex + 1
				}
				if err := s.store.AddPaperQuestion(ctx, row); err != nil {
					return err
				}
			}
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return s.GetPaperOutline(ctx, paperID)
}

func (s *Service) UpdatePaperQuestion(ctx context.Context, paperID, questionID uint64, cmd UpdatePaperQuestionCommand) (*PaperQuestionWithQuestion, error) {
	if _, err := s.store.GetPaper(ctx, paperID); err != nil {
		return nil, err
	}
	question, err := s.store.GetQuestion(ctx, questionID)
	if err != nil {
		return nil, err
	}
	if cmd.Score <= 0 {
		return nil, fmt.Errorf("%w: paper question score must be positive", ErrInvalidPaper)
	}
	if question.Status != QuestionStatusPublished {
		return nil, fmt.Errorf("%w: paper question must reference a published question", ErrInvalidPaper)
	}
	item := &PaperQuestion{PaperID: paperID, QuestionID: questionID, Score: cmd.Score, SortOrder: cmd.SortOrder}
	if err := s.store.UpdatePaperQuestion(ctx, item); err != nil {
		return nil, err
	}
	return s.store.GetPaperQuestionWithQuestion(ctx, paperID, questionID)
}

func (s *Service) RemovePaperQuestion(ctx context.Context, paperID, questionID uint64) error {
	return s.store.RemovePaperQuestion(ctx, paperID, questionID)
}
