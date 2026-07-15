package models

import "time"

type StokOpnameDetail struct {
	ID             string    `json:"id"`
	StokOpnameID   string    `json:"stok_opname_id"`
	BarangID       string    `json:"barang_id"`
	BatchID        *string   `json:"batch_id"`
	LokasiSimpanID *string   `json:"lokasi_simpan_id"`
	QtySistem      float64   `json:"qty_sistem"`
	QtyFisik       float64   `json:"qty_fisik"`
	Selisih        *float64  `json:"selisih"`
	Catatan        *string   `json:"catatan"`
	CreatedAt      time.Time `json:"created_at"`
}
