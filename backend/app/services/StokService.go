package services

import "apotek-api/app/models"

type StokService struct{}

func (StokService) RecordMutation(mutasi models.StokMutasi) error {
	// Every stock change must flow through stok_mutasi.
	return nil
}

func (StokService) LowStock() ([]models.Obat, error) {
	return []models.Obat{}, nil
}

func (StokService) ExpiredSoon(days int) ([]models.Stok, error) {
	return []models.Stok{}, nil
}
