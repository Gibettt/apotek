package requests

import "errors"

type BarangRequest struct {
	Kode            string  `json:"kode"`
	Nama            string  `json:"nama"`
	NamaGenerik     string  `json:"nama_generik"`
	KategoriID      *string `json:"kategori_id"`
	JenisID         *string `json:"jenis_id"`
	GolonganID      *string `json:"golongan_id"`
	PabrikID        *string `json:"pabrik_id"`
	PrincipalID     *string `json:"principal_id"`
	SatuanDefaultID *string `json:"satuan_default_id"`
	Komposisi       string  `json:"komposisi"`
	Indikasi        string  `json:"indikasi"`
	AturanPakai     string  `json:"aturan_pakai"`
	GambarURL       string  `json:"gambar_url"`
	StokMinimum     float64 `json:"stok_minimum"`
	StokMaksimum    float64 `json:"stok_maksimum"`
	PerluBatch      bool    `json:"perlu_batch"`
	PerluExpired    bool    `json:"perlu_expired"`
	Status          bool    `json:"status"`
}

func (request BarangRequest) Validate() error {
	if request.Kode == "" || request.Nama == "" {
		return errors.New("kode dan nama barang wajib diisi")
	}
	return nil
}
