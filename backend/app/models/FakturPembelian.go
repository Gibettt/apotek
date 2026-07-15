package models

import "time"

type FakturPembelian struct {
	ID                string     `json:"id"`
	CabangID          string     `json:"cabang_id"`
	SupplierID        string     `json:"supplier_id"`
	SuratPesananID    *string    `json:"surat_pesanan_id"`
	NomorFaktur       string     `json:"nomor_faktur"`
	NomorInternal     string     `json:"nomor_internal"`
	TanggalFaktur     time.Time  `json:"tanggal_faktur"`
	TanggalJatuhTempo *time.Time `json:"tanggal_jatuh_tempo"`
	Subtotal          float64    `json:"subtotal"`
	DiskonTotal       float64    `json:"diskon_total"`
	PajakTotal        float64    `json:"pajak_total"`
	GrandTotal        float64    `json:"grand_total"`
	Status            string     `json:"status"`
	Catatan           *string    `json:"catatan"`
	DibuatOleh        *string    `json:"dibuat_oleh"`
	DipostingOleh     *string    `json:"diposting_oleh"`
	DipostingAt       *time.Time `json:"diposting_at"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}
