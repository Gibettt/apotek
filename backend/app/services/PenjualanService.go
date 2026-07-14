package services

import "apotek-api/app/models"

type PenjualanService struct {
	StokService StokService
}

func (service PenjualanService) Checkout(penjualan models.Penjualan, details []models.PenjualanDetail) (models.Penjualan, error) {
	for _, detail := range details {
		_ = service.StokService.RecordMutation(models.StokMutasi{
			ObatID:     detail.ObatID,
			TipeMutasi: "keluar",
			Jumlah:     detail.Jumlah,
			Sumber:     "penjualan",
		})
	}

	return penjualan, nil
}
