package services

import "apotek-api/app/models"

type ResepService struct {
	PenjualanService PenjualanService
}

func (service ResepService) ProcessToPenjualan(resep models.Resep) (models.Penjualan, error) {
	penjualan := models.Penjualan{
		CabangID: "",
		Status:   "selesai",
	}

	return service.PenjualanService.Checkout(penjualan, []models.PenjualanDetail{})
}
