package services

import "apotek-api/app/models"

type StokService struct{}

func (StokService) RecordMutation(kartuStok models.KartuStok) error {
	// Every stock change must flow through kartu_stok.
	return nil
}

func (StokService) LowStock() ([]models.Barang, error) {
	return []models.Barang{}, nil
}

func (StokService) ExpiredSoon(days int) ([]models.BatchBarang, error) {
	return []models.BatchBarang{}, nil
}
