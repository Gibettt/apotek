package controllers

import "net/http"

type ResepController struct{}

func (ResepController) Index(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("resep.index"))
}
func (ResepController) Create(w http.ResponseWriter, r *http.Request) {
	created(w, modulePayload("resep.create"))
}
func (ResepController) Show(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("resep.show"))
}
func (ResepController) Update(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("resep.update"))
}
func (ResepController) Proses(w http.ResponseWriter, r *http.Request) {
	created(w, modulePayload("resep.proses"))
}
