package models

import "time"

type KonversiSatuan struct {
	ID            string    `json:"id"`
	BarangID      string    `json:"barang_id"`
	SatuanDariID  string    `json:"satuan_dari_id"`
	SatuanKeID    string    `json:"satuan_ke_id"`
	NilaiKonversi float64   `json:"nilai_konversi"`
	Catatan       *string   `json:"catatan"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
