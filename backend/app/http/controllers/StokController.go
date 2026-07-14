package controllers

import "net/http"

type StokController struct{}

func (StokController) Index(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("stok.index"))
}
func (StokController) Masuk(w http.ResponseWriter, r *http.Request) {
	created(w, modulePayload("stok.masuk"))
}
func (StokController) Keluar(w http.ResponseWriter, r *http.Request) {
	created(w, modulePayload("stok.keluar"))
}
func (StokController) Opname(w http.ResponseWriter, r *http.Request) {
	created(w, modulePayload("stok.opname"))
}
func (StokController) HampirHabis(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("stok.hampir_habis"))
}
func (StokController) Expired(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("stok.expired"))
}
func (StokController) Mutasi(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("stok.mutasi"))
}
