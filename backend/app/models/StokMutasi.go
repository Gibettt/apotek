package models

import "time"

type StokMutasi struct {
	ID          int       `json:"id"`
	ObatID      int       `json:"obat_id"`
	TipeMutasi  string    `json:"tipe_mutasi"`
	Jumlah      int       `json:"jumlah"`
	Sumber      string    `json:"sumber"`
	ReferensiID int       `json:"referensi_id"`
	StokSebelum int       `json:"stok_sebelum"`
	StokSesudah int       `json:"stok_sesudah"`
	Keterangan  string    `json:"keterangan"`
	CreatedBy   string    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
}