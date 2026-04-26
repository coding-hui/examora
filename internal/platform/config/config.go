package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	AppEnv   string
	AppHost  string
	AppPort  string
	LogLevel string

	DatabaseDSN string

	RedisAddr     string
	RedisPassword string
	RedisDB       int

	LogtoEndpoint    string
	LogtoAppID       string
	LogtoAPIAudience string

	SandboxAddr string

	JWTAccessTokenTTL  time.Duration
	JWTRefreshTokenTTL time.Duration

	SeedAdminSubject    string
	SeedAdminDisplayName string
}

func Load() Config {
	return Config{
		AppEnv:             get("APP_ENV", "development"),
		AppHost:            get("APP_HOST", get("API_HOST", "0.0.0.0")),
		AppPort:            get("APP_PORT", get("API_PORT", "8080")),
		LogLevel:           get("LOG_LEVEL", "info"),
		DatabaseDSN:        get("DATABASE_DSN", legacyDatabaseURL()),
		RedisAddr:          redisAddr(),
		RedisPassword:      get("REDIS_PASSWORD", ""),
		RedisDB:            getInt("REDIS_DB", 0),
		LogtoEndpoint:      strings.TrimRight(get("LOGTO_ENDPOINT", ""), "/"),
		LogtoAppID:         get("LOGTO_APP_ID", ""),
		LogtoAPIAudience:   get("LOGTO_API_AUDIENCE", get("LOGTO_APP_ID", "")),
		SandboxAddr:        get("SANDBOX_ADDR", "http://localhost:8081"),
		JWTAccessTokenTTL:  time.Duration(getInt("JWT_ACCESS_TOKEN_TTL", 7200)) * time.Second,
		JWTRefreshTokenTTL: time.Duration(getInt("JWT_REFRESH_TOKEN_TTL", 604800)) * time.Second,
		SeedAdminSubject:   get("SEED_ADMIN_SUBJECT", ""),
		SeedAdminDisplayName: get("SEED_ADMIN_DISPLAY_NAME", "Admin"),
	}
}

func (c Config) Address() string {
	return c.AppHost + ":" + c.AppPort
}

func (c Config) Issuer() string {
	if c.LogtoEndpoint == "" {
		return ""
	}
	return c.LogtoEndpoint + "/oidc"
}

func (c Config) JWKSURI() string {
	if c.LogtoEndpoint == "" {
		return ""
	}
	return c.LogtoEndpoint + "/oidc/jwks"
}

func get(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getInt(key string, fallback int) int {
	value, err := strconv.Atoi(get(key, ""))
	if err != nil {
		return fallback
	}
	return value
}

func legacyDatabaseURL() string {
	return get("DATABASE_URL", "host=localhost user=examora password=examora dbname=examora_dev port=5432 sslmode=disable TimeZone=Asia/Shanghai")
}

func redisAddr() string {
	if value := os.Getenv("REDIS_ADDR"); value != "" {
		return value
	}
	url := get("REDIS_URL", "")
	if strings.HasPrefix(url, "redis://") {
		return strings.TrimPrefix(url, "redis://")
	}
	return "localhost:6379"
}
