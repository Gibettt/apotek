package models

import "time"

type Pengguna struct {
	ID          string     `json:"id"`
	AuthUserID  *string    `json:"auth_user_id"`
	NamaLengkap string     `json:"nama_lengkap"`
	Username    *string    `json:"username"`
	Email       *string    `json:"email"`
	Telepon     *string    `json:"telepon"`
	RoleID      *string    `json:"role_id"`
	Status      string     `json:"status"`
	LastLoginAt *time.Time `json:"last_login_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}
