package controllers

import "net/http"

type NotifikasiController struct{}

func (NotifikasiController) Index(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("notifikasi.index"))
}
func (NotifikasiController) Baca(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("notifikasi.baca"))
}
func (NotifikasiController) BacaSemua(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("notifikasi.baca_semua"))
}
