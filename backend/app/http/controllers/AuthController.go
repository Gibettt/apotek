package controllers

import "net/http"

type AuthController struct{}

func (AuthController) Login(w http.ResponseWriter, r *http.Request) {
	created(w, map[string]interface{}{
		"access_token": "supabase-jwt-from-auth-service",
		"user": map[string]string{
			"id":    "uuid",
			"name":  "Owner Apotek",
			"email": "owner@apotek.local",
			"role":  "owner",
		},
	})
}

func (AuthController) Logout(w http.ResponseWriter, r *http.Request) {
	message(w, http.StatusOK, "logout berhasil")
}

func (AuthController) Me(w http.ResponseWriter, r *http.Request) {
	ok(w, map[string]string{
		"id":    "uuid",
		"name":  "Owner Apotek",
		"email": "owner@apotek.local",
		"role":  "owner",
	})
}
