package models

import "time"

type ResepDetail struct {
	ID               string    `json:"id"`
	ResepID          string    `json:"resep_id"`
	BarangID         *string   `json:"barang_id"`
	SatuanID         *string   `json:"satuan_id"`
	Qty              float64   `json:"qty"`
	AturanPakai      *string   `json:"aturan_pakai"`
	InstruksiRacikan *string   `json:"instruksi_racikan"`
	Racikan          bool      `json:"racikan"`
	Catatan          *string   `json:"catatan"`
	CreatedAt        time.Time `json:"created_at"`
}
