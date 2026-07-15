package models

import "time"

type SaldoStok struct {
	ID             string    `json:"id"`
	CabangID       string    `json:"cabang_id"`
	BarangID       string    `json:"barang_id"`
	BatchID        *string   `json:"batch_id"`
	LokasiSimpanID *string   `json:"lokasi_simpan_id"`
	Qty            float64   `json:"qty"`
	QtyReserved    float64   `json:"qty_reserved"`
	HargaPokokRata float64   `json:"harga_pokok_rata"`
	UpdatedAt      time.Time `json:"updated_at"`
}
