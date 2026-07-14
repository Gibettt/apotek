package models

import "time"

type Notifikasi struct {
	ID          int       `json:"id"`
	Tipe        string    `json:"tipe"`
	Judul       string    `json:"judul"`
	Pesan       string    `json:"pesan"`
	ReferensiID int       `json:"referensi_id"`
	IsRead      bool      `json:"is_read"`
	TargetRole  string    `json:"target_role"`
	CreatedAt   time.Time `json:"created_at"`
}
