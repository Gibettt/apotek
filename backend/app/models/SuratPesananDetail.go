package models

import "time"

type SuratPesananDetail struct {
	ID             string    `json:"id"`
	SuratPesananID string    `json:"surat_pesanan_id"`
	BarangID       string    `json:"barang_id"`
	SatuanID       *string   `json:"satuan_id"`
	Qty            float64   `json:"qty"`
	HargaEstimasi  float64   `json:"harga_estimasi"`
	Catatan        *string   `json:"catatan"`
	CreatedAt      time.Time `json:"created_at"`
}
