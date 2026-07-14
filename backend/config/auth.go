package config

import "os"

type AuthConfig struct {
	SupabaseJWTSecret string
}

func LoadAuthConfig() AuthConfig {
	return AuthConfig{SupabaseJWTSecret: os.Getenv("SUPABASE_JWT_SECRET")}
}
