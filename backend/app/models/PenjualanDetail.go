package models

import "time"

type PenjualanDetail struct {
	ID            string    `json:"id"`
	PenjualanID   string    `json:"penjualan_id"`
	BarangID      string    `json:"barang_id"`
	BatchID       *string   `json:"batch_id"`
	SatuanID      *string   `json:"satuan_id"`
	Qty           float64   `json:"qty"`
	HargaJual     float64   `json:"harga_jual"`
	DiskonPersen  float64   `json:"diskon_persen"`
	DiskonNominal float64   `json:"diskon_nominal"`
	Subtotal      float64   `json:"subtotal"`
	HargaPokok    float64   `json:"harga_pokok"`
	CreatedAt     time.Time `json:"created_at"`
}
