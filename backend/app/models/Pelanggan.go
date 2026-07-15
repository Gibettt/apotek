package models

import "time"

type Pelanggan struct {
	ID            string     `json:"id"`
	Kode          string     `json:"kode"`
	Nama          string     `json:"nama"`
	Telepon       *string    `json:"telepon"`
	Email         *string    `json:"email"`
	Alamat        *string    `json:"alamat"`
	TanggalLahir  *time.Time `json:"tanggal_lahir"`
	JenisKelamin  *string    `json:"jenis_kelamin"`
	CatatanAlergi *string    `json:"catatan_alergi"`
	Member        bool       `json:"member"`
	Aktif         bool       `json:"aktif"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}
