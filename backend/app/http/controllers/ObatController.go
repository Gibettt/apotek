package controllers

import "net/http"

type ObatController struct{}

func (ObatController) Index(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("obat.index"))
}
func (ObatController) Create(w http.ResponseWriter, r *http.Request) {
	created(w, modulePayload("obat.create"))
}
func (ObatController) Show(w http.ResponseWriter, r *http.Request) { ok(w, modulePayload("obat.show")) }
func (ObatController) Update(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("obat.update"))
}
func (ObatController) Delete(w http.ResponseWriter, r *http.Request) {
	message(w, http.StatusOK, "obat dinonaktifkan")
}
func (ObatController) Search(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("obat.search"))
}
