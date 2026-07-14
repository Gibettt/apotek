package models

import "time"

type Obat struct {
	ID               int       `json:"id"`
	KodeObat         string    `json:"kode_obat"`
	NamaObat         string    `json:"nama_obat"`
	KategoriID       int       `json:"kategori_id"`
	SupplierID       int       `json:"supplier_id"`
	Satuan           string    `json:"satuan"`
	HargaBeli        float64   `json:"harga_beli"`
	HargaJual        float64   `json:"harga_jual"`
	StokMinimum      int       `json:"stok_minimum"`
	GambarURL        string    `json:"gambar_url"`
	Deskripsi        string    `json:"deskripsi"`
	Golongan         string    `json:"golongan"`
	MembutuhkanResep bool      `json:"membutuhkan_resep"`
	Status           bool      `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
