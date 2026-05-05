package config

import "testing"

func TestLoadParsesRedisURL(t *testing.T) {
	t.Setenv("REDIS_ADDR", "")
	t.Setenv("REDIS_PASSWORD", "")
	t.Setenv("REDIS_DB", "")
	t.Setenv("REDIS_URL", "redis://:secret@localhost:6380/2")

	cfg := Load()

	if cfg.RedisAddr != "localhost:6380" {
		t.Fatalf("RedisAddr = %q, want localhost:6380", cfg.RedisAddr)
	}
	if cfg.RedisPassword != "secret" {
		t.Fatalf("RedisPassword = %q, want secret", cfg.RedisPassword)
	}
	if cfg.RedisDB != 2 {
		t.Fatalf("RedisDB = %d, want 2", cfg.RedisDB)
	}
}

func TestLoadPrefersExplicitRedisSettings(t *testing.T) {
	t.Setenv("REDIS_ADDR", "redis.internal:6379")
	t.Setenv("REDIS_PASSWORD", "explicit")
	t.Setenv("REDIS_DB", "3")
	t.Setenv("REDIS_URL", "redis://:from-url@localhost:6380/2")

	cfg := Load()

	if cfg.RedisAddr != "redis.internal:6379" {
		t.Fatalf("RedisAddr = %q, want redis.internal:6379", cfg.RedisAddr)
	}
	if cfg.RedisPassword != "explicit" {
		t.Fatalf("RedisPassword = %q, want explicit", cfg.RedisPassword)
	}
	if cfg.RedisDB != 3 {
		t.Fatalf("RedisDB = %d, want 3", cfg.RedisDB)
	}
}

func TestLoadDefaultsRedisAddrToIPv4Localhost(t *testing.T) {
	t.Setenv("REDIS_ADDR", "")
	t.Setenv("REDIS_PASSWORD", "")
	t.Setenv("REDIS_DB", "")
	t.Setenv("REDIS_URL", "")

	cfg := Load()

	if cfg.RedisAddr != "127.0.0.1:6379" {
		t.Fatalf("RedisAddr = %q, want 127.0.0.1:6379", cfg.RedisAddr)
	}
}
