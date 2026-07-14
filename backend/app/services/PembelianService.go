package services

import "apotek-api/app/models"

type PembelianService struct {
	StokService StokService
}

func (service PembelianService) ConfirmReceived(pembelian models.Pembelian, details []models.PembelianDetail) error {
	for _, detail := range details {
		if err := service.StokService.RecordMutation(models.StokMutasi{
			ObatID:     detail.ObatID,
			TipeMutasi: "masuk",
			Jumlah:     detail.Jumlah,
			Sumber:     "pembelian",
		}); err != nil {
			return err
		}
	}

	return nil
}
