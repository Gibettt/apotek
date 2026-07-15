package requests

import "errors"

type ResepItemRequest struct {
	BarangID    string `json:"barang_id"`
	AturanPakai string `json:"aturan_pakai"`
	Jumlah      int    `json:"jumlah"`
	Catatan     string `json:"catatan"`
}

type ResepRequest struct {
	PelangganID  string             `json:"pelanggan_id"`
	DokterID     string             `json:"dokter_id"`
	TanggalResep string             `json:"tanggal_resep"`
	Catatan      string             `json:"catatan"`
	Items        []ResepItemRequest `json:"items"`
}

func (request ResepRequest) Validate() error {
	if request.PelangganID == "" || request.DokterID == "" || len(request.Items) == 0 {
		return errors.New("pelanggan, dokter, dan item resep wajib diisi")
	}
	return nil
}
