package models

import "time"

type Pengaturan struct {
	ID        string    `json:"id"`
	CabangID  *string   `json:"cabang_id"`
	Key       string    `json:"key"`
	Value     *string   `json:"value"`
	Group     *string   `json:"group"`
	Label     *string   `json:"label"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
