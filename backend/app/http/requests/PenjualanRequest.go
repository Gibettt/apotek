package requests

import "errors"

type PenjualanItemRequest struct {
	BarangID string `json:"barang_id"`
	Jumlah   int    `json:"jumlah"`
}

type PenjualanRequest struct {
	CabangID         string                 `json:"cabang_id"`
	PelangganID      *string                `json:"pelanggan_id"`
	ResepID          *string                `json:"resep_id"`
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
