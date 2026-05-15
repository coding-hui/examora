package store

import (
	"context"
	"time"

	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/library"
)

type paperQuestionWithQuestionRow struct {
	ID                 uint64
	PaperID            uint64
	SectionID          uint64
	QuestionID         uint64
	Score              float64
	SortOrder          int
	CreatedAt          time.Time
	QuestionTitle      string
	QuestionType       string
	QuestionDifficulty *string
	QuestionStatus     string
}

func (s *Store) ListPaperQuestions(ctx context.Context, paperID uint64) ([]library.PaperQuestion, error) {
	items, err := s.ListPaperQuestionsWithQuestion(ctx, paperID)
	if err != nil {
		return nil, err
	}
	questions := make([]library.PaperQuestion, 0, len(items))
	for _, item := range items {
		questions = append(questions, item.PaperQuestion)
	}
	return questions, nil
}

func (s *Store) ListPaperQuestionsWithQuestion(ctx context.Context, paperID uint64) ([]library.PaperQuestionWithQuestion, error) {
	var rows []paperQuestionWithQuestionRow
	if err := s.db(ctx).
		Table("paper_questions AS pq").
		Select("pq.id, pq.paper_id, pq.section_id, pq.question_id, pq.score, pq.sort_order, pq.created_at, q.title AS question_title, q.type AS question_type, q.difficulty AS question_difficulty, q.status AS question_status").
		Joins("JOIN questions AS q ON q.id = pq.question_id").
		Joins("LEFT JOIN paper_sections AS ps ON ps.id = pq.section_id").
		Where("pq.paper_id = ?", paperID).
		Order("COALESCE(ps.sort_order, 0) ASC, pq.sort_order ASC, pq.id ASC").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]library.PaperQuestionWithQuestion, 0, len(rows))
	for _, row := range rows {
		items = append(items, library.PaperQuestionWithQuestion{
			PaperQuestion: library.PaperQuestion{
				ID:         row.ID,
				PaperID:    row.PaperID,
				SectionID:  row.SectionID,
				QuestionID: row.QuestionID,
				Score:      row.Score,
				SortOrder:  row.SortOrder,
				CreatedAt:  row.CreatedAt,
			},
			QuestionTitle:      row.QuestionTitle,
			QuestionType:       row.QuestionType,
			QuestionDifficulty: row.QuestionDifficulty,
			QuestionStatus:     row.QuestionStatus,
		})
	}
	return items, nil
}

func (s *Store) GetPaperQuestionWithQuestion(ctx context.Context, paperID, questionID uint64) (*library.PaperQuestionWithQuestion, error) {
	var row paperQuestionWithQuestionRow
	if err := s.db(ctx).
		Table("paper_questions AS pq").
		Select("pq.id, pq.paper_id, pq.section_id, pq.question_id, pq.score, pq.sort_order, pq.created_at, q.title AS question_title, q.type AS question_type, q.difficulty AS question_difficulty, q.status AS question_status").
		Joins("JOIN questions AS q ON q.id = pq.question_id").
		Where("pq.paper_id = ? AND pq.question_id = ?", paperID, questionID).
		First(&row).Error; err != nil {
		return nil, database.MapNotFound(err, library.ErrQuestionNotFound)
	}
	return &library.PaperQuestionWithQuestion{
		PaperQuestion: library.PaperQuestion{
			ID:         row.ID,
			PaperID:    row.PaperID,
			SectionID:  row.SectionID,
			QuestionID: row.QuestionID,
			Score:      row.Score,
			SortOrder:  row.SortOrder,
			CreatedAt:  row.CreatedAt,
		},
		QuestionTitle:      row.QuestionTitle,
		QuestionType:       row.QuestionType,
		QuestionDifficulty: row.QuestionDifficulty,
		QuestionStatus:     row.QuestionStatus,
	}, nil
}

func (s *Store) UpdatePaperQuestion(ctx context.Context, item *library.PaperQuestion) error {
	result := s.db(ctx).
		Model(&database.PaperQuestionModel{}).
		Where("paper_id = ? AND question_id = ?", item.PaperID, item.QuestionID).
		Select("SectionID", "Score", "SortOrder").
		Updates(database.PaperQuestionModel{SectionID: item.SectionID, Score: item.Score, SortOrder: item.SortOrder})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return library.ErrQuestionNotFound
	}
	return nil
}

func toPaperQuestion(m *database.PaperQuestionModel) *library.PaperQuestion {
	return &library.PaperQuestion{
		ID:         m.ID,
		PaperID:    m.PaperID,
		SectionID:  m.SectionID,
		QuestionID: m.QuestionID,
		Score:      m.Score,
		SortOrder:  m.SortOrder,
		CreatedAt:  m.CreatedAt,
	}
}

func (s *Store) ListPaperSectionsWithQuestions(ctx context.Context, paperID uint64) ([]library.PaperSection, error) {
	var sectionRows []database.PaperSectionModel
	if err := s.db(ctx).Where("paper_id = ?", paperID).Order("sort_order ASC, id ASC").Find(&sectionRows).Error; err != nil {
		return nil, err
	}
	questions, err := s.ListPaperQuestionsWithQuestion(ctx, paperID)
	if err != nil {
		return nil, err
	}
	bySection := make(map[uint64][]library.PaperQuestionWithQuestion)
	for _, question := range questions {
		bySection[question.SectionID] = append(bySection[question.SectionID], question)
	}
	sections := make([]library.PaperSection, 0, len(sectionRows))
	for _, row := range sectionRows {
		section := library.PaperSection{
			ID:          row.ID,
			PaperID:     row.PaperID,
			Title:       row.Title,
			Description: row.Description,
			SortOrder:   row.SortOrder,
			CreatedAt:   row.CreatedAt,
			UpdatedAt:   row.UpdatedAt,
			Questions:   bySection[row.ID],
		}
		section.QuestionCount = len(section.Questions)
		for _, question := range section.Questions {
			section.TotalScore += question.Score
		}
		sections = append(sections, section)
	}
	return sections, nil
}

func (s *Store) GetPaperOutline(ctx context.Context, paperID uint64) (*library.PaperOutline, error) {
	paper, err := s.GetPaper(ctx, paperID)
	if err != nil {
		return nil, err
	}
	sections, err := s.ListPaperSectionsWithQuestions(ctx, paperID)
	if err != nil {
		return nil, err
	}
	outline := &library.PaperOutline{Paper: *paper, Sections: sections}
	for _, section := range sections {
		outline.QuestionCount += section.QuestionCount
		outline.TotalScore += section.TotalScore
	}
	outline.Paper.QuestionCount = outline.QuestionCount
	outline.Paper.TotalScore = outline.TotalScore
	return outline, nil
}
