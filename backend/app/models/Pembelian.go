package models

import "time"

type Pembelian struct {
	ID               int       `json:"id"`
	NomorPembelian   string    `json:"nomor_pembelian"`
	SupplierID       int       `json:"supplier_id"`
	TanggalPembelian time.Time `json:"tanggal_pembelian"`
	Subtotal         float64   `json:"subtotal"`
	Diskon           float64   `json:"diskon"`
	Pajak            float64   `json:"pajak"`
	Total            float64   `json:"total"`
	Status           string    `json:"status"`
	Catatan          string    `json:"catatan"`
	CreatedBy        string    `json:"created_by"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
