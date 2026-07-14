package requests

import "errors"

type ObatRequest struct {
	KodeObat         string  `json:"kode_obat"`
	NamaObat         string  `json:"nama_obat"`
	KategoriID       int     `json:"kategori_id"`
	SupplierID       int     `json:"supplier_id"`
	Satuan           string  `json:"satuan"`
	HargaBeli        float64 `json:"harga_beli"`
	HargaJual        float64 `json:"harga_jual"`
	StokMinimum      int     `json:"stok_minimum"`
	Golongan         string  `json:"golongan"`
	MembutuhkanResep bool    `json:"membutuhkan_resep"`
	Status           bool    `json:"status"`
}

func (request ObatRequest) Validate() error {
	if request.KodeObat == "" || request.NamaObat == "" {
		return errors.New("kode dan nama obat wajib diisi")
	}
	if request.HargaJual <= 0 {
		return errors.New("harga jual wajib lebih dari 0")
	}
	return nil
}
