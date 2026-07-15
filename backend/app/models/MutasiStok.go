package models

import "time"

type MutasiStok struct {
	ID             string     `json:"id"`
	Nomor          string     `json:"nomor"`
	Tanggal        time.Time  `json:"tanggal"`
	CabangAsalID   *string    `json:"cabang_asal_id"`
	CabangTujuanID *string    `json:"cabang_tujuan_id"`
	Status         string     `json:"status"`
	Catatan        *string    `json:"catatan"`
	DibuatOleh     *string    `json:"dibuat_oleh"`
	DipostingOleh  *string    `json:"diposting_oleh"`
	DipostingAt    *time.Time `json:"diposting_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}
