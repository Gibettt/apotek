package models

import "time"

type Pelanggan struct {
	ID           int       `json:"id"`
	Nama         string    `json:"nama"`
	Telepon      string    `json:"telepon"`
	Alamat       string    `json:"alamat"`
	TanggalLahir time.Time `json:"tanggal_lahir"`
	JenisKelamin string    `json:"jenis_kelamin"`
	NoBPJS       string    `json:"no_bpjs"`
	NoKTP        string    `json:"no_ktp"`
	Alergi       string    `json:"alergi"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
