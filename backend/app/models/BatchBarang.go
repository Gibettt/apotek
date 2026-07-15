package models

import "time"

type BatchBarang struct {
	ID              string     `json:"id"`
	BarangID        string     `json:"barang_id"`
	SupplierID      *string    `json:"supplier_id"`
	PabrikID        *string    `json:"pabrik_id"`
	KodeProduksi    *string    `json:"kode_produksi"`
	NomorBatch      string     `json:"nomor_batch"`
	TanggalProduksi *time.Time `json:"tanggal_produksi"`
	TanggalExpired  *time.Time `json:"tanggal_expired"`
	Catatan         *string    `json:"catatan"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}
