package models

import "time"

type Cabang struct {
	ID        string    `json:"id"`
	Kode      string    `json:"kode"`
	Nama      string    `json:"nama"`
	Telepon   *string   `json:"telepon"`
	Email     *string   `json:"email"`
	Alamat    *string   `json:"alamat"`
	Kota      *string   `json:"kota"`
	Provinsi  *string   `json:"provinsi"`
	KodePos   *string   `json:"kode_pos"`
	Aktif     bool      `json:"aktif"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
