package controllers

import (
	"encoding/json"
	"net/http"
)

type response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func ok(w http.ResponseWriter, data interface{}) {
	writeJSON(w, http.StatusOK, response{Success: true, Data: data})
}

func created(w http.ResponseWriter, data interface{}) {
	writeJSON(w, http.StatusCreated, response{Success: true, Data: data})
}

func message(w http.ResponseWriter, status int, text string) {
	writeJSON(w, status, response{Success: status < 400, Message: text})
}

func modulePayload(module string) map[string]string {
	return map[string]string{"module": module, "mode": "skeleton"}
}
