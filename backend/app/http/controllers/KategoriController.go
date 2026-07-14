package controllers

import "net/http"

type KategoriController struct{}

func (KategoriController) Index(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("kategori.index"))
}
func (KategoriController) Create(w http.ResponseWriter, r *http.Request) {
	created(w, modulePayload("kategori.create"))
}
func (KategoriController) Update(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("kategori.update"))
}
func (KategoriController) Delete(w http.ResponseWriter, r *http.Request) {
	message(w, http.StatusOK, "kategori dihapus")
}
