package models

import "time"

type Penjualan struct {
	ID               int       `json:"id"`
	NomorPenjualan   string    `json:"nomor_penjualan"`
	PelangganID      *int      `json:"pelanggan_id"`
	ResepID          *int      `json:"resep_id"`
	TanggalPenjualan time.Time `json:"tanggal_penjualan"`
	Subtotal         float64   `json:"subtotal"`
	Diskon           float64   `json:"diskon"`
	Pajak            float64   `json:"pajak"`
	Total            float64   `json:"total"`
	MetodePembayaran string    `json:"metode_pembayaran"`
	Bayar            float64   `json:"bayar"`
	Kembalian        float64   `json:"kembalian"`
	Status           string    `json:"status"`
	Catatan          string    `json:"catatan"`
	CreatedBy        string    `json:"created_by"`
	CreatedAt        time.Time `json:"created_at"`
}
