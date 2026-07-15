package models

import "time"

type DokterSpesialis struct {
	ID        string    `json:"id"`
	Kode      string    `json:"kode"`
	Nama      string    `json:"nama"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
