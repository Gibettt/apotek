package routes

import (
	"net/http"

	"apotek-api/app/http/controllers"
	"apotek-api/app/http/middleware"
)

type route struct {
	method  string
	path    string
	handler http.HandlerFunc
	roles   []string
}

func RegisterAPI(mux *http.ServeMux) {
	auth := controllers.AuthController{}
	obat := controllers.ObatController{}
	kategori := controllers.KategoriController{}
	supplier := controllers.SupplierController{}
	pelanggan := controllers.PelangganController{}
	stok := controllers.StokController{}
	pembelian := controllers.PembelianController{}
	penjualan := controllers.PenjualanController{}
	resep := controllers.ResepController{}
	laporan := controllers.LaporanController{}
	notifikasi := controllers.NotifikasiController{}
	users := controllers.UserController{}
	pengaturan := controllers.PengaturanController{}

	routes := []route{
		{http.MethodPost, "/api/v1/auth/login", auth.Login, nil},
		{http.MethodPost, "/api/v1/auth/logout", auth.Logout, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodGet, "/api/v1/auth/me", auth.Me, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodGet, "/api/v1/obat", obat.Index, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodPost, "/api/v1/obat", obat.Create, []string{"admin"}},
		{http.MethodGet, "/api/v1/obat/search", obat.Search, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodGet, "/api/v1/obat/{id}", obat.Show, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodPut, "/api/v1/obat/{id}", obat.Update, []string{"admin"}},
		{http.MethodDelete, "/api/v1/obat/{id}", obat.Delete, []string{"admin"}},
		{http.MethodGet, "/api/v1/kategori", kategori.Index, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodPost, "/api/v1/kategori", kategori.Create, []string{"admin"}},
		{http.MethodPut, "/api/v1/kategori/{id}", kategori.Update, []string{"admin"}},
		{http.MethodDelete, "/api/v1/kategori/{id}", kategori.Delete, []string{"admin"}},
		{http.MethodGet, "/api/v1/supplier", supplier.Index, []string{"owner", "admin"}},
		{http.MethodPost, "/api/v1/supplier", supplier.Create, []string{"admin"}},
		{http.MethodGet, "/api/v1/supplier/{id}", supplier.Show, []string{"owner", "admin"}},
		{http.MethodPut, "/api/v1/supplier/{id}", supplier.Update, []string{"admin"}},
		{http.MethodDelete, "/api/v1/supplier/{id}", supplier.Delete, []string{"admin"}},
		{http.MethodGet, "/api/v1/pelanggan", pelanggan.Index, []string{"owner", "admin", "kasir"}},
		{http.MethodPost, "/api/v1/pelanggan", pelanggan.Create, []string{"admin", "kasir"}},
		{http.MethodGet, "/api/v1/pelanggan/{id}", pelanggan.Show, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodPut, "/api/v1/pelanggan/{id}", pelanggan.Update, []string{"admin"}},
		{http.MethodGet, "/api/v1/stok", stok.Index, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodPost, "/api/v1/stok/masuk", stok.Masuk, []string{"admin", "apoteker"}},
		{http.MethodPost, "/api/v1/stok/keluar", stok.Keluar, []string{"admin", "apoteker"}},
		{http.MethodPost, "/api/v1/stok/opname", stok.Opname, []string{"admin", "apoteker"}},
		{http.MethodGet, "/api/v1/stok/hampir-habis", stok.HampirHabis, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodGet, "/api/v1/stok/expired", stok.Expired, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodGet, "/api/v1/stok/mutasi", stok.Mutasi, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodGet, "/api/v1/pembelian", pembelian.Index, []string{"admin"}},
		{http.MethodPost, "/api/v1/pembelian", pembelian.Create, []string{"admin"}},
		{http.MethodGet, "/api/v1/pembelian/{id}", pembelian.Show, []string{"admin"}},
		{http.MethodPut, "/api/v1/pembelian/{id}/terima", pembelian.Terima, []string{"admin"}},
		{http.MethodDelete, "/api/v1/pembelian/{id}", pembelian.Delete, []string{"admin"}},
		{http.MethodGet, "/api/v1/penjualan", penjualan.Index, []string{"owner", "admin"}},
		{http.MethodPost, "/api/v1/penjualan", penjualan.Create, []string{"kasir"}},
		{http.MethodGet, "/api/v1/penjualan/{id}", penjualan.Show, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodPost, "/api/v1/penjualan/{id}/batal", penjualan.Batal, []string{"admin"}},
		{http.MethodGet, "/api/v1/resep", resep.Index, []string{"admin", "apoteker"}},
		{http.MethodPost, "/api/v1/resep", resep.Create, []string{"apoteker"}},
		{http.MethodGet, "/api/v1/resep/{id}", resep.Show, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodPut, "/api/v1/resep/{id}", resep.Update, []string{"apoteker"}},
		{http.MethodPost, "/api/v1/resep/{id}/proses", resep.Proses, []string{"apoteker"}},
		{http.MethodGet, "/api/v1/laporan/penjualan", laporan.Penjualan, []string{"owner", "admin"}},
		{http.MethodGet, "/api/v1/laporan/pembelian", laporan.Pembelian, []string{"owner", "admin"}},
		{http.MethodGet, "/api/v1/laporan/stok", laporan.Stok, []string{"owner", "admin"}},
		{http.MethodGet, "/api/v1/laporan/laba-rugi", laporan.LabaRugi, []string{"owner"}},
		{http.MethodGet, "/api/v1/laporan/dashboard", laporan.Dashboard, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodGet, "/api/v1/notifikasi", notifikasi.Index, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodPut, "/api/v1/notifikasi/{id}/baca", notifikasi.Baca, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodPut, "/api/v1/notifikasi/baca-semua", notifikasi.BacaSemua, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodGet, "/api/v1/users", users.Index, []string{"owner"}},
		{http.MethodPost, "/api/v1/users", users.Create, []string{"owner"}},
		{http.MethodPut, "/api/v1/users/{id}", users.Update, []string{"owner"}},
		{http.MethodPut, "/api/v1/users/{id}/status", users.Status, []string{"owner"}},
		{http.MethodGet, "/api/v1/pengaturan", pengaturan.Index, []string{"owner", "admin", "apoteker", "kasir"}},
		{http.MethodPut, "/api/v1/pengaturan", pengaturan.Update, []string{"owner", "admin"}},
	}

	for _, route := range routes {
		register(mux, route)
	}
}

func register(mux *http.ServeMux, item route) {
	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != item.method {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		item.handler(w, r)
	}))

	if len(item.roles) > 0 {
		handler = middleware.Role(item.roles...)(handler)
		handler = middleware.Auth(handler)
	}

	handler = middleware.Log(middleware.Cors(handler))
	mux.Handle(item.method+" "+item.path, handler)
}
