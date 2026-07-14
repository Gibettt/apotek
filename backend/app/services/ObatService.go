package services

import "apotek-api/app/models"

type ObatService struct{}

func (ObatService) Search(query string) ([]models.Obat, error) {
	return []models.Obat{}, nil
}

func (ObatService) EnsureCanSellWithoutResep(obat models.Obat) bool {
	return !obat.MembutuhkanResep
}
