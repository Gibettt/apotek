package models

type PenjualanDetail struct {
	ID          int     `json:"id"`
	PenjualanID int     `json:"penjualan_id"`
	ObatID      int     `json:"obat_id"`
	Jumlah      int     `json:"jumlah"`
	HargaJual   float64 `json:"harga_jual"`
	Diskon      float64 `json:"diskon"`
	Subtotal    float64 `json:"subtotal"`
}
