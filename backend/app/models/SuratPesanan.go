package models

import "time"

type SuratPesanan struct {
	ID            string     `json:"id"`
	CabangID      string     `json:"cabang_id"`
	SupplierID    string     `json:"supplier_id"`
	Nomor         string     `json:"nomor"`
	JenisSP       string     `json:"jenis_sp"`
	Tanggal       time.Time  `json:"tanggal"`
	Status        string     `json:"status"`
	Catatan       *string    `json:"catatan"`
	DibuatOleh    *string    `json:"dibuat_oleh"`
	DisetujuiOleh *string    `json:"disetujui_oleh"`
	DisetujuiAt   *time.Time `json:"disetujui_at"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}
