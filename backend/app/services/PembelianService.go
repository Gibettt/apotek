package services

import "apotek-api/app/models"

type PembelianService struct {
	StokService StokService
}

func (service PembelianService) ConfirmReceived(fakturPembelian models.FakturPembelian, details []models.FakturPembelianDetail) error {
	sumberTabel := "faktur_pembelian"
	for _, detail := range details {
		if err := service.StokService.RecordMutation(models.KartuStok{
			CabangID:    fakturPembelian.CabangID,
			BarangID:    detail.BarangID,
			BatchID:     detail.BatchID,
			TipeMutasi:  "masuk",
			SumberTabel: &sumberTabel,
			SumberID:    &fakturPembelian.ID,
			QtyMasuk:    detail.Qty,
			HargaPokok:  detail.HargaPokok,
		}); err != nil {
			return err
		}
	}

	return nil
}
