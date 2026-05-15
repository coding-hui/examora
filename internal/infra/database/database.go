package database

import (
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func Open(dsn string) (*gorm.DB, error) {
	dsn = strings.TrimSpace(dsn)
	if strings.HasPrefix(dsn, "sqlite://") || strings.HasPrefix(dsn, "file:") || strings.HasPrefix(dsn, "./") || strings.HasPrefix(dsn, "/") {
		sqlitePath := strings.TrimPrefix(dsn, "sqlite://")
		sqlitePath = strings.TrimPrefix(sqlitePath, "file:")
		return gorm.Open(sqlite.Open(sqlitePath), &gorm.Config{})
	}
	return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&UserModel{},
		&QuestionModel{},
		&TestCaseModel{},
		&PaperModel{},
		&PaperSectionModel{},
		&PaperQuestionModel{},
		&ExamModel{},
		&SubmissionModel{},
		&JudgeTaskModel{},
		&ClientEventModel{},
		// M1: Snapshot models
		&ExamSnapshotModel{},
		&PaperSectionSnapshotModel{},
		&QuestionSnapshotModel{},
		&ExamSessionModel{},
		&ExamResultModel{},
		&QuestionResultModel{},
		&AnswerDraftModel{},
	)
}
