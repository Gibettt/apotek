package services

import "apotek-api/app/models"

type PenjualanService struct {
	StokService StokService
}

func (service PenjualanService) Checkout(penjualan models.Penjualan, details []models.PenjualanDetail) (models.Penjualan, error) {
	sumberTabel := "penjualan"
	for _, detail := range details {
		_ = service.StokService.RecordMutation(models.KartuStok{
			CabangID:    penjualan.CabangID,
			BarangID:    detail.BarangID,
			BatchID:     detail.BatchID,
			TipeMutasi:  "keluar",
			SumberTabel: &sumberTabel,
			SumberID:    &penjualan.ID,
			QtyKeluar:   detail.Qty,
			HargaPokok:  detail.HargaPokok,
		})
	}

	return penjualan, nil
}
