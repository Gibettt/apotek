package models

import "time"

type GolonganObat struct {
	ID                string    `json:"id"`
	Kode              string    `json:"kode"`
	Nama              string    `json:"nama"`
	ButuhResep        bool      `json:"butuh_resep"`
	ButuhSuratPesanan bool      `json:"butuh_surat_pesanan"`
	Deskripsi         *string   `json:"deskripsi"`
	Aktif             bool      `json:"aktif"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}
