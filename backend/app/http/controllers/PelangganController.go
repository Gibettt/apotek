package controllers

import "net/http"

type PelangganController struct{}

func (PelangganController) Index(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("pelanggan.index"))
}
func (PelangganController) Create(w http.ResponseWriter, r *http.Request) {
	created(w, modulePayload("pelanggan.create"))
}
func (PelangganController) Show(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("pelanggan.show"))
}
func (PelangganController) Update(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("pelanggan.update"))
}
