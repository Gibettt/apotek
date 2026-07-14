package controllers

import "net/http"

type PembelianController struct{}

func (PembelianController) Index(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("pembelian.index"))
}
func (PembelianController) Create(w http.ResponseWriter, r *http.Request) {
	created(w, modulePayload("pembelian.create"))
}
func (PembelianController) Show(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("pembelian.show"))
}
func (PembelianController) Terima(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("pembelian.terima"))
}
func (PembelianController) Delete(w http.ResponseWriter, r *http.Request) {
	message(w, http.StatusOK, "pembelian dibatalkan")
}
