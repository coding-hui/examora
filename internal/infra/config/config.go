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

	LogtoEnabled     bool
	LogtoEndpoint    string
	LogtoAppID       string
	LogtoAPIAudience string

	SandboxAddr string

	JWTSecret          string
	JWTAccessTokenTTL  time.Duration
	JWTRefreshTokenTTL time.Duration
	AdminDefaultPW     string
}

func Load() Config {
	return Config{
		AppEnv:             get("APP_ENV", "development"),
		AppHost:            get("APP_HOST", get("API_HOST", "0.0.0.0")),
		AppPort:            get("APP_PORT", get("API_PORT", "8080")),
		LogLevel:           get("LOG_LEVEL", "info"),
		DatabaseDSN:        get("DATABASE_DSN", "./examora.db"),
		RedisAddr:          redisAddr(),
		RedisPassword:      get("REDIS_PASSWORD", ""),
		RedisDB:            getInt("REDIS_DB", 0),
		LogtoEnabled:       getBool("LOGTO_ENABLED", false),
		LogtoEndpoint:      strings.TrimRight(get("LOGTO_ENDPOINT", "https://auth.micromoving.net"), "/"),
		LogtoAppID:         get("LOGTO_APP_ID", ""),
		LogtoAPIAudience:   get("LOGTO_API_AUDIENCE", get("LOGTO_APP_ID", "https://auth.micromoving.net")),
		SandboxAddr:        get("SANDBOX_ADDR", "http://localhost:8081"),
		JWTSecret:          get("JWT_SECRET", "examora-local-jwt-secret-change-in-production"),
		JWTAccessTokenTTL:  time.Duration(getInt("JWT_ACCESS_TOKEN_TTL", 7200)) * time.Second,
		JWTRefreshTokenTTL: time.Duration(getInt("JWT_REFRESH_TOKEN_TTL", 604800)) * time.Second,
		AdminDefaultPW:     get("ADMIN_DEFAULT_PASSWORD", "examora-admin-2024"),
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

func (c Config) IsLogtoEnabled() bool {
	return c.LogtoEnabled
}

func getBool(key string, fallback bool) bool {
	v := strings.ToLower(os.Getenv(key))
	if v == "true" || v == "1" || v == "yes" {
		return true
	}
	if v == "false" || v == "0" || v == "no" || v == "" {
		return fallback
	}
	return fallback
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

func redisAddr() string {
	if value := os.Getenv("REDIS_ADDR"); value != "" {
		return value
	}
	url := get("REDIS_URL", "")
	if url, ok := strings.CutPrefix(url, "redis://"); ok {
		return url
	}
	return "localhost:6379"
}
