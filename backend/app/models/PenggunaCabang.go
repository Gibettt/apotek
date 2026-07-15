package models

import "time"

type PenggunaCabang struct {
	ID            string    `json:"id"`
	PenggunaID    string    `json:"pengguna_id"`
	CabangID      string    `json:"cabang_id"`
	DefaultCabang bool      `json:"default_cabang"`
	CreatedAt     time.Time `json:"created_at"`
}
