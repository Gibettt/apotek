package controllers

import "net/http"

type PenjualanController struct{}

func (PenjualanController) Index(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("penjualan.index"))
}
func (PenjualanController) Create(w http.ResponseWriter, r *http.Request) {
	created(w, modulePayload("penjualan.create"))
}
func (PenjualanController) Show(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("penjualan.show"))
}
func (PenjualanController) Batal(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("penjualan.batal"))
}
