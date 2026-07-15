package models

import "time"

type Dokter struct {
	ID          string    `json:"id"`
	Kode        string    `json:"kode"`
	Nama        string    `json:"nama"`
	NomorSIP    *string   `json:"nomor_sip"`
	SpesialisID *string   `json:"spesialis_id"`
	Telepon     *string   `json:"telepon"`
	Email       *string   `json:"email"`
	Alamat      *string   `json:"alamat"`
	Aktif       bool      `json:"aktif"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
