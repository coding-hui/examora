// Command dev-seed writes local development fixtures.
package main

import (
	"context"
	"fmt"
	"log"

	"github.com/coding-hui/examora/internal/infra/config"
	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/infra/transaction"
	"github.com/coding-hui/examora/internal/library"
	librarystore "github.com/coding-hui/examora/internal/library/store"
)

func main() {
	ctx := context.Background()
	cfg := config.Load()

	db, err := database.Open(cfg.DatabaseDSN)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("auto migrate: %v", err)
	}

	store := librarystore.New(db)
	service, err := library.ProvideService(store, transaction.NewManager(db))
	if err != nil {
		log.Fatalf("provide library service: %v", err)
	}

	for _, seed := range questionSeeds() {
		if err := upsertQuestion(ctx, service, seed); err != nil {
			log.Fatalf("seed %q: %v", seed.Title, err)
		}
	}

	fmt.Printf("seeded %d question fixtures into %s\n", len(questionSeeds()), cfg.DatabaseDSN)
}

func upsertQuestion(ctx context.Context, service *library.Service, cmd library.SaveQuestionCommand) error {
	items, _, err := service.ListQuestions(ctx, library.QuestionFilter{
		Keyword:  cmd.Title,
		PageNum:  1,
		PageSize: 100,
	})
	if err != nil {
		return err
	}
	for _, item := range items {
		if item.Title == cmd.Title {
			_, err := service.UpdateQuestion(ctx, item.ID, cmd)
			return err
		}
	}
	_, err = service.CreateQuestion(ctx, cmd)
	return err
}

func stringPtr(value string) *string {
	return &value
}

func questionSeeds() []library.SaveQuestionCommand {
	return []library.SaveQuestionCommand{
		{
			Type:       library.QuestionTypeProgramming,
			Title:      "两数之和输出",
			Content:    map[string]any{"text": "读取两个整数并输出它们的和。"},
			Difficulty: stringPtr("EASY"),
			Language:   stringPtr("GO"),
			StarterCode: stringPtr(`package main

import "fmt"

func main() {
	var a, b int
	fmt.Scan(&a, &b)
	fmt.Println(a + b)
}
`),
			TimeLimitMS:   1000,
			MemoryLimitMB: 128,
			Status:        library.QuestionStatusDraft,
			CreatedBy:     1,
			TestCases: []library.TestCase{
				{Input: "1 2\n", ExpectedOutput: "3\n", TimeLimitMS: 1000, MemoryLimitMB: 128, IsSample: true, SortOrder: 0},
				{Input: "100 -7\n", ExpectedOutput: "93\n", TimeLimitMS: 1000, MemoryLimitMB: 128, IsHidden: true, SortOrder: 1},
			},
		},
		{
			Type:       library.QuestionTypeTrueFalse,
			Title:      "Redis 单线程模型判断",
			Content:    map[string]any{"text": "Redis 的命令执行核心路径通常是单线程处理。"},
			Answer:     map[string]any{"correct": true},
			Difficulty: stringPtr("EASY"),
			Status:     library.QuestionStatusPublished,
			CreatedBy:  1,
		},
		{
			Type:  library.QuestionTypeMultipleChoice,
			Title: "数据库索引适用场景",
			Content: map[string]any{
				"text": "哪些场景通常适合建立索引？",
				"options": []map[string]any{
					{"key": "A", "text": "高频出现在 WHERE 条件中的字段"},
					{"key": "B", "text": "经常参与排序的字段"},
					{"key": "C", "text": "取值极少且更新频繁的布尔字段"},
					{"key": "D", "text": "经常参与 JOIN 的外键字段"},
				},
			},
			Answer:     map[string]any{"choices": []string{"A", "B", "D"}},
			Difficulty: stringPtr("MEDIUM"),
			Status:     library.QuestionStatusDraft,
			CreatedBy:  1,
		},
		{
			Type:  library.QuestionTypeSingleChoice,
			Title: "HTTP 状态码基础",
			Content: map[string]any{
				"text": "以下哪个状态码表示请求成功？",
				"options": []map[string]any{
					{"key": "A", "text": "200"},
					{"key": "B", "text": "301"},
					{"key": "C", "text": "404"},
					{"key": "D", "text": "500"},
				},
			},
			Answer:     map[string]any{"choice": "A"},
			Difficulty: stringPtr("EASY"),
			Status:     library.QuestionStatusPublished,
			CreatedBy:  1,
		},
		{
			Type:       library.QuestionTypeFillBlank,
			Title:      "事务 ACID 填空",
			Content:    map[string]any{"text": "数据库事务的 ACID 分别代表原子性、一致性、隔离性和____。"},
			Answer:     map[string]any{"blanks": []string{"持久性", "Durability"}},
			Difficulty: stringPtr("MEDIUM"),
			Status:     library.QuestionStatusDraft,
			CreatedBy:  1,
		},
		{
			Type:       library.QuestionTypeShortAnswer,
			Title:      "接口幂等性说明",
			Content:    map[string]any{"text": "简述什么是接口幂等性，并举一个常见实现方式。"},
			Answer:     map[string]any{"reference": "相同请求执行一次或多次产生相同业务结果。常见方式包括幂等键、唯一约束、去重表或状态机校验。"},
			Difficulty: stringPtr("HARD"),
			Status:     library.QuestionStatusPublished,
			CreatedBy:  1,
		},
	}
}
