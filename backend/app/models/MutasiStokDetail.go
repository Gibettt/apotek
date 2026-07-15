package models

import "time"

type MutasiStokDetail struct {
	ID           string    `json:"id"`
	MutasiStokID string    `json:"mutasi_stok_id"`
	BarangID     string    `json:"barang_id"`
	BatchID      *string   `json:"batch_id"`
	SatuanID     *string   `json:"satuan_id"`
	Qty          float64   `json:"qty"`
	Catatan      *string   `json:"catatan"`
	CreatedAt    time.Time `json:"created_at"`
}
