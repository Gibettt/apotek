package models

import "time"

type JurnalUmum struct {
	ID          string    `json:"id"`
	CabangID    *string   `json:"cabang_id"`
	Nomor       string    `json:"nomor"`
	Tanggal     time.Time `json:"tanggal"`
	Sumber      string    `json:"sumber"`
	SumberTabel *string   `json:"sumber_tabel"`
	SumberID    *string   `json:"sumber_id"`
	Deskripsi   *string   `json:"deskripsi"`
	Status      string    `json:"status"`
	DibuatOleh  *string   `json:"dibuat_oleh"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
