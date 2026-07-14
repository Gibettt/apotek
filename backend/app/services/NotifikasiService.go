package services

import "apotek-api/app/models"

type NotifikasiService struct {
	StokService StokService
}

func (service NotifikasiService) GenerateDailyAlerts(expiredDays int) ([]models.Notifikasi, error) {
	_, _ = service.StokService.LowStock()
	_, _ = service.StokService.ExpiredSoon(expiredDays)
	return []models.Notifikasi{}, nil
}
