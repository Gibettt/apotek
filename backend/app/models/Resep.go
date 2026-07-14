package models

import "time"

type Resep struct {
	ID            int       `json:"id"`
	NomorResep    string    `json:"nomor_resep"`
	PelangganID   int       `json:"pelanggan_id"`
	PenjualanID   *int      `json:"penjualan_id"`
	NamaDokter    string    `json:"nama_dokter"`
	NoSIPDokter   string    `json:"no_sip_dokter"`
	AsalPuskesmas string    `json:"asal_puskesmas"`
	TanggalResep  time.Time `json:"tanggal_resep"`
	Catatan       string    `json:"catatan"`
	Status        string    `json:"status"`
	CreatedBy     string    `json:"created_by"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
