package models

import "time"

type BarcodeBarang struct {
	ID        string    `json:"id"`
	BarangID  string    `json:"barang_id"`
	SatuanID  *string   `json:"satuan_id"`
	Barcode   string    `json:"barcode"`
	Aktif     bool      `json:"aktif"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
