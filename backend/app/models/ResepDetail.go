package models

type ResepDetail struct {
	ID          int    `json:"id"`
	ResepID     int    `json:"resep_id"`
	ObatID      int    `json:"obat_id"`
	AturanPakai string `json:"aturan_pakai"`
	Jumlah      int    `json:"jumlah"`
	Catatan     string `json:"catatan"`
}
