package models

import "time"

type Notifikasi struct {
	ID             string    `json:"id"`
	CabangID       *string   `json:"cabang_id"`
	PenggunaID     *string   `json:"pengguna_id"`
	TargetRole     *string   `json:"target_role"`
	Tipe           string    `json:"tipe"`
	Judul          string    `json:"judul"`
	Pesan          *string   `json:"pesan"`
	ReferensiTabel *string   `json:"referensi_tabel"`
	ReferensiID    *string   `json:"referensi_id"`
	IsRead         bool      `json:"is_read"`
	CreatedAt      time.Time `json:"created_at"`
}
