package models

import "time"

type Supplier struct {
	ID             string    `json:"id"`
	Kode           string    `json:"kode"`
	Nama           string    `json:"nama"`
	TipeSupplier   *string   `json:"tipe_supplier"`
	Npwp           *string   `json:"npwp"`
	Telepon        *string   `json:"telepon"`
	Email          *string   `json:"email"`
	Alamat         *string   `json:"alamat"`
	Kota           *string   `json:"kota"`
	Provinsi       *string   `json:"provinsi"`
	ContactPerson  *string   `json:"contact_person"`
	TempoBayarHari int       `json:"tempo_bayar_hari"`
	Aktif          bool      `json:"aktif"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
