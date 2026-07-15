package models

import "time"

type KartuStok struct {
	ID          string    `json:"id"`
	Tanggal     time.Time `json:"tanggal"`
	CabangID    string    `json:"cabang_id"`
	BarangID    string    `json:"barang_id"`
	BatchID     *string   `json:"batch_id"`
	TipeMutasi  string    `json:"tipe_mutasi"`
	SumberTabel *string   `json:"sumber_tabel"`
	SumberID    *string   `json:"sumber_id"`
	QtyMasuk    float64   `json:"qty_masuk"`
	QtyKeluar   float64   `json:"qty_keluar"`
	SaldoAkhir  float64   `json:"saldo_akhir"`
	HargaPokok  float64   `json:"harga_pokok"`
	Keterangan  *string   `json:"keterangan"`
	DibuatOleh  *string   `json:"dibuat_oleh"`
	CreatedAt   time.Time `json:"created_at"`
}
