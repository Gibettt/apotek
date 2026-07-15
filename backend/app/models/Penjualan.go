package models

import "time"

type Penjualan struct {
	ID                   string     `json:"id"`
	CabangID             string     `json:"cabang_id"`
	ShiftKasirID         *string    `json:"shift_kasir_id"`
	PelangganID          *string    `json:"pelanggan_id"`
	NomorInvoice         string     `json:"nomor_invoice"`
	Tanggal              time.Time  `json:"tanggal"`
	TipePenjualan        string     `json:"tipe_penjualan"`
	Subtotal             float64    `json:"subtotal"`
	DiskonTotal          float64    `json:"diskon_total"`
	PajakTotal           float64    `json:"pajak_total"`
	GrandTotal           float64    `json:"grand_total"`
	BayarTotal           float64    `json:"bayar_total"`
	Kembalian            float64    `json:"kembalian"`
	StatusBayar          string     `json:"status_bayar"`
	Status               string     `json:"status"`
	Catatan              *string    `json:"catatan"`
	DibuatOleh           *string    `json:"dibuat_oleh"`
	PaymentProvider      *string    `json:"payment_provider"`
	PaymentExternalID    *string    `json:"payment_external_id"`
	PaymentProviderID    *string    `json:"payment_provider_id"`
	PaymentTransactionID *string    `json:"payment_transaction_id"`
	PaymentURL           *string    `json:"payment_url"`
	PaymentStatus        *string    `json:"payment_status"`
	PaymentExpiresAt     *time.Time `json:"payment_expires_at"`
	AccurateInvoiceID    *int64     `json:"accurate_invoice_id"`
	AccurateSyncStatus   *string    `json:"accurate_sync_status"`
	AccurateSyncError    *string    `json:"accurate_sync_error"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}
