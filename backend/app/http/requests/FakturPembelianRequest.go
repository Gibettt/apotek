package requests

import "errors"

type FakturPembelianItemRequest struct {
	BarangID       string  `json:"barang_id"`
	BatchNumber    string  `json:"batch_number"`
	TanggalExpired string  `json:"tanggal_expired"`
	Jumlah         int     `json:"jumlah"`
	HargaBeli      float64 `json:"harga_beli"`
	Diskon         float64 `json:"diskon"`
}

type FakturPembelianRequest struct {
	SupplierID    string                       `json:"supplier_id"`
	CabangID      string                       `json:"cabang_id"`
	TanggalFaktur string                       `json:"tanggal_faktur"`
	Catatan       string                       `json:"catatan"`
	Items         []FakturPembelianItemRequest `json:"items"`
}

func (request FakturPembelianRequest) Validate() error {
	if request.SupplierID == "" || request.CabangID == "" || len(request.Items) == 0 {
		return errors.New("supplier, cabang, dan item pembelian wajib diisi")
	}
	return nil
}
