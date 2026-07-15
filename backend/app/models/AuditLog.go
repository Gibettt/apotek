package models

import (
	"encoding/json"
	"time"
)

type AuditLog struct {
	ID          string          `json:"id"`
	Waktu       time.Time       `json:"waktu"`
	PenggunaID  *string         `json:"pengguna_id"`
	CabangID    *string         `json:"cabang_id"`
	Aksi        string          `json:"aksi"`
	SchemaTabel *string         `json:"schema_tabel"`
	NamaTabel   *string         `json:"nama_tabel"`
	RowID       *string         `json:"row_id"`
	DataLama    json.RawMessage `json:"data_lama"`
	DataBaru    json.RawMessage `json:"data_baru"`
	IPAddress   *string         `json:"ip_address"`
	UserAgent   *string         `json:"user_agent"`
	CreatedAt   time.Time       `json:"created_at"`
}
