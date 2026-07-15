package models

import "time"

type ReturPembelianDetail struct {
	ID               string    `json:"id"`
	ReturPembelianID string    `json:"retur_pembelian_id"`
	BarangID         string    `json:"barang_id"`
	BatchID          *string   `json:"batch_id"`
	SatuanID         *string   `json:"satuan_id"`
	Qty              float64   `json:"qty"`
	HargaRetur       float64   `json:"harga_retur"`
	Subtotal         float64   `json:"subtotal"`
	Alasan           *string   `json:"alasan"`
	CreatedAt        time.Time `json:"created_at"`
}
