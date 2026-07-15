package models

import "time"

type Pembayaran struct {
	ID             string    `json:"id"`
	PenjualanID    string    `json:"penjualan_id"`
	Metode         string    `json:"metode"`
	Jumlah         float64   `json:"jumlah"`
	NomorReferensi *string   `json:"nomor_referensi"`
	NamaBank       *string   `json:"nama_bank"`
	WaktuBayar     time.Time `json:"waktu_bayar"`
	Catatan        *string   `json:"catatan"`
	DibuatOleh     *string   `json:"dibuat_oleh"`
	CreatedAt      time.Time `json:"created_at"`
}
