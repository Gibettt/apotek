package services

import "apotek-api/app/models"

type ObatService struct{}

func (ObatService) Search(query string) ([]models.Barang, error) {
	return []models.Barang{}, nil
}

func (ObatService) EnsureCanSellWithoutResep(golongan models.GolonganObat) bool {
	return !golongan.ButuhResep
}
