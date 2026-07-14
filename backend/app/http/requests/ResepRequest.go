package requests

import "errors"

type ResepItemRequest struct {
	ObatID      int    `json:"obat_id"`
	AturanPakai string `json:"aturan_pakai"`
	Jumlah      int    `json:"jumlah"`
	Catatan     string `json:"catatan"`
}

type ResepRequest struct {
	PelangganID   int                `json:"pelanggan_id"`
	NamaDokter    string             `json:"nama_dokter"`
	NoSIPDokter   string             `json:"no_sip_dokter"`
	AsalPuskesmas string             `json:"asal_puskesmas"`
	TanggalResep  string             `json:"tanggal_resep"`
	Catatan       string             `json:"catatan"`
	Items         []ResepItemRequest `json:"items"`
}

func (request ResepRequest) Validate() error {
	if request.PelangganID == 0 || request.NamaDokter == "" || len(request.Items) == 0 {
		return errors.New("pelanggan, dokter, dan item resep wajib diisi")
	}
	return nil
}
