package models

import "time"

type LokasiSimpan struct {
	ID         string    `json:"id"`
	CabangID   *string   `json:"cabang_id"`
	Kode       string    `json:"kode"`
	Nama       string    `json:"nama"`
	TipeLokasi *string   `json:"tipe_lokasi"`
	Deskripsi  *string   `json:"deskripsi"`
	Aktif      bool      `json:"aktif"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
