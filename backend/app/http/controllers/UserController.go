package controllers

import "net/http"

type UserController struct{}

func (UserController) Index(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("users.index"))
}
func (UserController) Create(w http.ResponseWriter, r *http.Request) {
	created(w, modulePayload("users.create"))
}
func (UserController) Update(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("users.update"))
}
func (UserController) Status(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("users.status"))
}
