package models

import "time"

type Permission struct {
	ID        string    `json:"id"`
	Kode      string    `json:"kode"`
	Nama      string    `json:"nama"`
	Modul     string    `json:"modul"`
	Deskripsi *string   `json:"deskripsi"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
