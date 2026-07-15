package models

import "time"

type FakturPembelianDetail struct {
	ID                string    `json:"id"`
	FakturPembelianID string    `json:"faktur_pembelian_id"`
	BarangID          string    `json:"barang_id"`
	BatchID           *string   `json:"batch_id"`
	SatuanID          *string   `json:"satuan_id"`
	Qty               float64   `json:"qty"`
	HargaBeli         float64   `json:"harga_beli"`
	DiskonPersen      float64   `json:"diskon_persen"`
	DiskonNominal     float64   `json:"diskon_nominal"`
	PajakPersen       float64   `json:"pajak_persen"`
	PajakNominal      float64   `json:"pajak_nominal"`
	Subtotal          float64   `json:"subtotal"`
	HargaPokok        float64   `json:"harga_pokok"`
	CreatedAt         time.Time `json:"created_at"`
}
