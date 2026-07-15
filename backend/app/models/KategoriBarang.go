package models

import "time"

type KategoriBarang struct {
	ID        string    `json:"id"`
	Kode      string    `json:"kode"`
	Nama      string    `json:"nama"`
	Deskripsi *string   `json:"deskripsi"`
	Aktif     bool      `json:"aktif"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
