package models

import "time"

type Resep struct {
	ID           string    `json:"id"`
	PenjualanID  *string   `json:"penjualan_id"`
	PelangganID  *string   `json:"pelanggan_id"`
	DokterID     *string   `json:"dokter_id"`
	NomorResep   *string   `json:"nomor_resep"`
	TanggalResep time.Time `json:"tanggal_resep"`
	NamaPasien   *string   `json:"nama_pasien"`
	UmurPasien   *string   `json:"umur_pasien"`
	AlamatPasien *string   `json:"alamat_pasien"`
	Catatan      *string   `json:"catatan"`
	Status       string    `json:"status"`
	DibuatOleh   *string   `json:"dibuat_oleh"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
