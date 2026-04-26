package database

import (
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Open(dsn string) (*gorm.DB, error) {
	return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&UserModel{},
		&QuestionModel{},
		&TestCaseModel{},
		&PaperModel{},
		&PaperQuestionModel{},
		&ExamModel{},
		&SubmissionModel{},
		&JudgeTaskModel{},
		&ClientEventModel{},
	)
}
