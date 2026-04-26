package server

import (
	"fmt"
	"log/slog"

	"github.com/hibiken/asynq"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"github.com/coding-hui/examora/internal/api"
	"github.com/coding-hui/examora/internal/auth"
	authcasbin "github.com/coding-hui/examora/internal/auth/casbin"
	authlogto "github.com/coding-hui/examora/internal/auth/logto"
	authstore "github.com/coding-hui/examora/internal/auth/store"
	authtoken "github.com/coding-hui/examora/internal/auth/token"
	"github.com/coding-hui/examora/internal/exam"
	examstore "github.com/coding-hui/examora/internal/exam/store"
	"github.com/coding-hui/examora/internal/infra/config"
	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/infra/logger"
	infraredis "github.com/coding-hui/examora/internal/infra/redis"
	"github.com/coding-hui/examora/internal/infra/transaction"
	"github.com/coding-hui/examora/internal/judge"
	judgequeue "github.com/coding-hui/examora/internal/judge/queue"
	judgesandbox "github.com/coding-hui/examora/internal/judge/sandbox"
	judgestore "github.com/coding-hui/examora/internal/judge/store"
	"github.com/coding-hui/examora/internal/library"
	librarystore "github.com/coding-hui/examora/internal/library/store"
)

type Container struct {
	Auth    *auth.Service
	Library *library.Service
	Exam    *exam.Service
	Judge   *judge.Service
	API     *api.Server
	DB      *gorm.DB
	Redis   *redis.Client
	Config  config.Config
	Logger  *slog.Logger
}

func NewContainer(cfg config.Config) (*Container, error) {
	log := logger.New(cfg.LogLevel)

	db, err := database.Open(cfg.DatabaseDSN)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}
	if err := database.AutoMigrate(db); err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	redisClient, err := infraredis.New(cfg.RedisAddr, cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}

	c := &Container{
		Config: cfg,
		DB:     db,
		Redis:  redisClient,
		Logger: log,
	}

	authSvc, err := c.provideAuth()
	if err != nil {
		return nil, err
	}
	c.Auth = authSvc
	judgeSvc, err := c.provideJudge()
	if err != nil {
		return nil, err
	}
	c.Judge = judgeSvc
	librarySvc, err := c.provideLibrary()
	if err != nil {
		return nil, err
	}
	c.Library = librarySvc
	examSvc, err := c.provideExam()
	if err != nil {
		return nil, err
	}
	c.Exam = examSvc
	apiServer, err := api.ProvideServer(c.Auth, c.Library, c.Exam, c.Judge, c.Config)
	if err != nil {
		return nil, err
	}
	c.API = apiServer

	return c, nil
}

func (c *Container) provideAuth() (*auth.Service, error) {
	userRepo := authstore.NewUserStore(c.DB)
	jwtService := authtoken.NewJWTService(c.Config.JWTSecret, c.Config.JWTAccessTokenTTL)
	pwdService := authtoken.NewPasswordService()
	blacklist := authtoken.NewBlacklistService(c.Redis)

	casbinEnforcer, err := authcasbin.NewEnforcer(c.DB)
	if err != nil {
		return nil, fmt.Errorf("failed to create casbin enforcer: %w", err)
	}

	return auth.ProvideService(userRepo, jwtService, pwdService, casbinEnforcer, c.Config, blacklist, authlogto.NewVerifier(c.Config))
}

func (c *Container) provideLibrary() (*library.Service, error) {
	store := librarystore.New(c.DB)
	return library.ProvideService(store)
}

func (c *Container) provideExam() (*exam.Service, error) {
	store := examstore.New(c.DB)
	papers := librarystore.New(c.DB)
	return exam.ProvideService(store, papers, c.Judge)
}

func (c *Container) provideJudge() (*judge.Service, error) {
	judgeTaskStore := judgestore.New(c.DB)
	examStore := examstore.New(c.DB)
	libraryStore := librarystore.New(c.DB)
	tx := transaction.NewManager(c.DB)
	asynqClient := asynq.NewClient(asynq.RedisClientOpt{Addr: c.Config.RedisAddr, Password: c.Config.RedisPassword, DB: c.Config.RedisDB})
	sandboxRunner := judgesandbox.New(c.Config.SandboxAddr)

	return judge.ProvideService(judgeTaskStore, examStore, libraryStore, judgequeue.New(asynqClient), sandboxRunner, tx)
}
