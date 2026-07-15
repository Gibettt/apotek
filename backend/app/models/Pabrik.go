package models

import "time"

type Pabrik struct {
	ID        string    `json:"id"`
	Kode      string    `json:"kode"`
	Nama      string    `json:"nama"`
	Alamat    *string   `json:"alamat"`
	Telepon   *string   `json:"telepon"`
	Aktif     bool      `json:"aktif"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
