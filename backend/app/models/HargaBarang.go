package models

import "time"

type HargaBarang struct {
	ID             string     `json:"id"`
	BarangID       string     `json:"barang_id"`
	CabangID       *string    `json:"cabang_id"`
	TipeHarga      string     `json:"tipe_harga"`
	SatuanID       *string    `json:"satuan_id"`
	HargaBeli      float64    `json:"harga_beli"`
	HargaJual      float64    `json:"harga_jual"`
	MarginPersen   *float64   `json:"margin_persen"`
	TanggalMulai   time.Time  `json:"tanggal_mulai"`
	TanggalSelesai *time.Time `json:"tanggal_selesai"`
	Aktif          bool       `json:"aktif"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}
