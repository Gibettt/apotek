package config

import "os"

type AppConfig struct {
	Port string
}

func LoadAppConfig() AppConfig {
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	return AppConfig{Port: port}
}
