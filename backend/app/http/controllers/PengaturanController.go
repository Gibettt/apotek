package controllers

import "net/http"

type PengaturanController struct{}

func (PengaturanController) Index(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("pengaturan.index"))
}
func (PengaturanController) Update(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("pengaturan.update"))
}
