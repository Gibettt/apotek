package controllers

import "net/http"

type SupplierController struct{}

func (SupplierController) Index(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("supplier.index"))
}
func (SupplierController) Create(w http.ResponseWriter, r *http.Request) {
	created(w, modulePayload("supplier.create"))
}
func (SupplierController) Show(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("supplier.show"))
}
func (SupplierController) Update(w http.ResponseWriter, r *http.Request) {
	ok(w, modulePayload("supplier.update"))
}
func (SupplierController) Delete(w http.ResponseWriter, r *http.Request) {
	message(w, http.StatusOK, "supplier dinonaktifkan")
}
