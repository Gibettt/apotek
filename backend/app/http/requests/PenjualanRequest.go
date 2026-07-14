package requests

import "errors"

type PenjualanItemRequest struct {
	ObatID int `json:"obat_id"`
	Jumlah int `json:"jumlah"`
}

type PenjualanRequest struct {
	PelangganID      *int                   `json:"pelanggan_id"`
	ResepID          *int                   `json:"resep_id"`
	MetodePembayaran string                 `json:"metode_pembayaran"`
	Bayar            float64                `json:"bayar"`
	Items            []PenjualanItemRequest `json:"items"`
}

func (request PenjualanRequest) Validate() error {
	if len(request.Items) == 0 {
		return errors.New("item penjualan wajib diisi")
	}
	if request.MetodePembayaran == "" {
		return errors.New("metode pembayaran wajib diisi")
	}
	return nil
}
