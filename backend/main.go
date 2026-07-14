package main

import (
	"log"
	"net/http"

	"apotek-api/config"
	"apotek-api/routes"
)

func main() {
	appConfig := config.LoadAppConfig()
	mux := http.NewServeMux()
	routes.RegisterAPI(mux)

	log.Printf("apotek api listening on :%s", appConfig.Port)
	if err := http.ListenAndServe(":"+appConfig.Port, mux); err != nil {
		log.Fatal(err)
	}
}
