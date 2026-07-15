package models

import "time"

type Barang struct {
	ID              string    `json:"id"`
	Kode            string    `json:"kode"`
	BarcodeDefault  *string   `json:"barcode_default"`
	Nama            string    `json:"nama"`
	NamaGenerik     *string   `json:"nama_generik"`
	KategoriID      *string   `json:"kategori_id"`
	JenisID         *string   `json:"jenis_id"`
	GolonganID      *string   `json:"golongan_id"`
	PabrikID        *string   `json:"pabrik_id"`
	PrincipalID     *string   `json:"principal_id"`
	SatuanDefaultID *string   `json:"satuan_default_id"`
	SatuanBeliID    *string   `json:"satuan_beli_id"`
	SatuanJualID    *string   `json:"satuan_jual_id"`
	LokasiDefaultID *string   `json:"lokasi_default_id"`
	Komposisi       *string   `json:"komposisi"`
	Indikasi        *string   `json:"indikasi"`
	AturanPakai     *string   `json:"aturan_pakai"`
	GambarURL       *string   `json:"gambar_url"`
	StokMinimum     float64   `json:"stok_minimum"`
	StokMaksimum    float64   `json:"stok_maksimum"`
	PerluBatch      bool      `json:"perlu_batch"`
	PerluExpired    bool      `json:"perlu_expired"`
	Aktif           bool      `json:"aktif"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
