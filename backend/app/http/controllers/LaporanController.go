package controllers

import "net/http"

type LaporanController struct{}

func (LaporanController) Penjualan(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("laporan.penjualan"))
}
func (LaporanController) Pembelian(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("laporan.pembelian"))
}
func (LaporanController) Stok(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("laporan.stok"))
}
func (LaporanController) LabaRugi(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("laporan.laba_rugi"))
}
func (LaporanController) Dashboard(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("laporan.dashboard"))
}
