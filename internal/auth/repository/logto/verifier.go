package logto

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/coding-hui/examora/internal/auth/usecase"
	"github.com/coding-hui/examora/internal/platform/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/lestrrat-go/jwx/v2/jwk"
)

type Verifier struct {
	cfg       config.Config
	mu        sync.Mutex
	cachedSet jwk.Set
	expiresAt time.Time
}

func NewVerifier(cfg config.Config) *Verifier {
	return &Verifier{cfg: cfg}
}

type claims struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	jwt.RegisteredClaims
}

func (v *Verifier) Verify(ctx context.Context, token string) (*usecase.Claims, error) {
	if v.cfg.Issuer() == "" || v.cfg.LogtoAPIAudience == "" {
		return nil, errors.New("logto config is incomplete")
	}
	parsed := &claims{}
	_, err := jwt.ParseWithClaims(token, parsed, func(t *jwt.Token) (any, error) {
		kid, _ := t.Header["kid"].(string)
		key, err := v.lookupKey(ctx, kid, false)
		if err != nil {
			key, err = v.lookupKey(ctx, kid, true)
		}
		return key, err
	}, jwt.WithIssuer(v.cfg.Issuer()), jwt.WithAudience(v.cfg.LogtoAPIAudience))
	if err != nil {
		return nil, err
	}
	if parsed.Subject == "" {
		return nil, errors.New("missing subject")
	}
	var name *string
	if parsed.Name != "" {
		name = &parsed.Name
	}
	var email *string
	if parsed.Email != "" {
		email = &parsed.Email
	}
	var exp time.Time
	if parsed.ExpiresAt != nil {
		exp = parsed.ExpiresAt.Time
	}
	return &usecase.Claims{Subject: parsed.Subject, DisplayName: name, Email: email, ExpiresAt: exp}, nil
}

func (v *Verifier) lookupKey(ctx context.Context, kid string, force bool) (any, error) {
	if kid == "" {
		return nil, errors.New("missing kid")
	}
	v.mu.Lock()
	defer v.mu.Unlock()
	if force || v.cachedSet == nil || time.Now().After(v.expiresAt) {
		set, err := jwk.Fetch(ctx, v.cfg.JWKSURI())
		if err != nil {
			return nil, err
		}
		v.cachedSet = set
		v.expiresAt = time.Now().Add(10 * time.Minute)
	}
	key, ok := v.cachedSet.LookupKeyID(kid)
	if !ok {
		return nil, errors.New("unknown kid")
	}
	var raw any
	if err := key.Raw(&raw); err != nil {
		return nil, err
	}
	return raw, nil
}
