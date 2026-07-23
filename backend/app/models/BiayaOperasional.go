package models

import "time"

type BiayaOperasional struct {
	ID             string     `json:"id"`
	CabangID       *string    `json:"cabang_id"`
	AkunID         *string    `json:"akun_id"`
	Nomor          string     `json:"nomor"`
	Tanggal        time.Time  `json:"tanggal"`
	NamaBiaya      string     `json:"nama_biaya"`
	Jumlah         float64    `json:"jumlah"`
	MetodeBayar    *string    `json:"metode_bayar"`
	Catatan        *string    `json:"catatan"`
	DibuatOleh     *string    `json:"dibuat_oleh"`
	DibatalkanAt   *time.Time `json:"dibatalkan_at"`
	DibatalkanOleh *string    `json:"dibatalkan_oleh"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}
