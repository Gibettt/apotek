package requests

import "errors"

type PembelianItemRequest struct {
	ObatID         int     `json:"obat_id"`
	BatchNumber    string  `json:"batch_number"`
	TanggalExpired string  `json:"tanggal_expired"`
	Jumlah         int     `json:"jumlah"`
	HargaBeli      float64 `json:"harga_beli"`
	Diskon         float64 `json:"diskon"`
}

type PembelianRequest struct {
	SupplierID       int                    `json:"supplier_id"`
	TanggalPembelian string                 `json:"tanggal_pembelian"`
	Catatan          string                 `json:"catatan"`
	Items            []PembelianItemRequest `json:"items"`
}

func (request PembelianRequest) Validate() error {
	if request.SupplierID == 0 || len(request.Items) == 0 {
		return errors.New("supplier dan item pembelian wajib diisi")
	}
	return nil
}
