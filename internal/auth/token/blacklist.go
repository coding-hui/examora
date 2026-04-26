package token

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type BlacklistService struct {
	redis *redis.Client
}

func NewBlacklistService(redis *redis.Client) *BlacklistService {
	return &BlacklistService{redis: redis}
}

func (s *BlacklistService) Blacklist(ctx context.Context, tokenHash string, expiry time.Duration) error {
	key := fmt.Sprintf("jwt:blacklist:%s", tokenHash)
	return s.redis.Set(ctx, key, "1", expiry).Err()
}

func (s *BlacklistService) IsBlacklisted(ctx context.Context, tokenHash string) (bool, error) {
	key := fmt.Sprintf("jwt:blacklist:%s", tokenHash)
	exists, err := s.redis.Exists(ctx, key).Result()
	return exists > 0, err
}
