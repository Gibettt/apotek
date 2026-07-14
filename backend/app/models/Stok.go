package models

import "time"

type Stok struct {
	ID             int       `json:"id"`
	ObatID         int       `json:"obat_id"`
	BatchNumber    string    `json:"batch_number"`
	TanggalExpired time.Time `json:"tanggal_expired"`
	Jumlah         int       `json:"jumlah"`
	Lokasi         string    `json:"lokasi"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
