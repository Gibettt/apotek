package models

import "time"

type Supplier struct {
	ID           int       `json:"id"`
	NamaSupplier string    `json:"nama_supplier"`
	Telepon      string    `json:"telepon"`
	Email        string    `json:"email"`
	Alamat       string    `json:"alamat"`
	KontakPerson string    `json:"kontak_person"`
	NPWP         string    `json:"npwp"`
	Status       bool      `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
