package models

import "time"

type ReturPembelian struct {
	ID                string     `json:"id"`
	CabangID          string     `json:"cabang_id"`
	SupplierID        string     `json:"supplier_id"`
	FakturPembelianID *string    `json:"faktur_pembelian_id"`
	Nomor             string     `json:"nomor"`
	Tanggal           time.Time  `json:"tanggal"`
	Total             float64    `json:"total"`
	Status            string     `json:"status"`
	Alasan            *string    `json:"alasan"`
	DibuatOleh        *string    `json:"dibuat_oleh"`
	DipostingOleh     *string    `json:"diposting_oleh"`
	DipostingAt       *time.Time `json:"diposting_at"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}
