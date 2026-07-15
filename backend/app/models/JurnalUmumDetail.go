package models

import "time"

type JurnalUmumDetail struct {
	ID           string    `json:"id"`
	JurnalUmumID string    `json:"jurnal_umum_id"`
	AkunID       string    `json:"akun_id"`
	Debit        float64   `json:"debit"`
	Kredit       float64   `json:"kredit"`
	Keterangan   *string   `json:"keterangan"`
	CreatedAt    time.Time `json:"created_at"`
}
