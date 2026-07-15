package requests

import "errors"

type PenggunaRequest struct {
	NamaLengkap string  `json:"nama_lengkap"`
	Username    string  `json:"username"`
	Email       string  `json:"email"`
	Telepon     string  `json:"telepon"`
	RoleID      *string `json:"role_id"`
	Status      string  `json:"status"`
}

func (request PenggunaRequest) Validate() error {
	if request.NamaLengkap == "" || request.Email == "" || request.RoleID == nil {
		return errors.New("nama lengkap, email, dan role wajib diisi")
	}
	return nil
}
