package models

import "time"

type PembelianDetail struct {
	ID             int       `json:"id"`
	PembelianID    int       `json:"pembelian_id"`
	ObatID         int       `json:"obat_id"`
	BatchNumber    string    `json:"batch_number"`
	TanggalExpired time.Time `json:"tanggal_expired"`
	Jumlah         int       `json:"jumlah"`
	HargaBeli      float64   `json:"harga_beli"`
	Diskon         float64   `json:"diskon"`
	Subtotal       float64   `json:"subtotal"`
}
