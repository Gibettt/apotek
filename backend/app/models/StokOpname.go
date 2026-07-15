package models

import "time"

type StokOpname struct {
	ID            string     `json:"id"`
	CabangID      string     `json:"cabang_id"`
	Nomor         string     `json:"nomor"`
	Tanggal       time.Time  `json:"tanggal"`
	Status        string     `json:"status"`
	Catatan       *string    `json:"catatan"`
	DibuatOleh    *string    `json:"dibuat_oleh"`
	DipostingOleh *string    `json:"diposting_oleh"`
	DipostingAt   *time.Time `json:"diposting_at"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}
