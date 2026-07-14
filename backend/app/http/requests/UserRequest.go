package requests

import "errors"

type UserRequest struct {
	Name   string `json:"name"`
	Email  string `json:"email"`
	RoleID int    `json:"role_id"`
	Status bool   `json:"status"`
}

func (request UserRequest) Validate() error {
	if request.Name == "" || request.Email == "" || request.RoleID == 0 {
		return errors.New("nama, email, dan role wajib diisi")
	}
	return nil
}
