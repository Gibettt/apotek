package models

import "time"

type ShiftKasir struct {
	ID               string     `json:"id"`
	CabangID         string     `json:"cabang_id"`
	KasirID          string     `json:"kasir_id"`
	NomorShift       string     `json:"nomor_shift"`
	WaktuBuka        time.Time  `json:"waktu_buka"`
	WaktuTutup       *time.Time `json:"waktu_tutup"`
	SaldoAwal        float64    `json:"saldo_awal"`
	SaldoAkhirSistem float64    `json:"saldo_akhir_sistem"`
	SaldoAkhirFisik  float64    `json:"saldo_akhir_fisik"`
	Selisih          float64    `json:"selisih"`
	Status           string     `json:"status"`
	Catatan          *string    `json:"catatan"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}
