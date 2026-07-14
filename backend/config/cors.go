package config

import (
	"os"
	"strings"
)

type CorsConfig struct {
	AllowedOrigins []string
}

func LoadCorsConfig() CorsConfig {
	value := os.Getenv("CORS_ALLOWED_ORIGINS")
	if value == "" {
		value = "http://localhost:3000"
	}

	return CorsConfig{AllowedOrigins: strings.Split(value, ",")}
}
