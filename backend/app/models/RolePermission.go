package models

import "time"

type RolePermission struct {
	ID           string    `json:"id"`
	RoleID       string    `json:"role_id"`
	PermissionID string    `json:"permission_id"`
	CreatedAt    time.Time `json:"created_at"`
}
