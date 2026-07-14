package migrations

type Migration struct {
	ID  string
	SQL string
}

var All = []Migration{
	{ID: "001_create_users_table", SQL: Migration001CreateUsersTable},
	{ID: "002_create_roles_table", SQL: Migration002CreateRolesTable},
	{ID: "003_create_obat_table", SQL: Migration003CreateObatTable},
	{ID: "004_create_supplier_pelanggan_table", SQL: Migration004CreateSupplierPelangganTable},
	{ID: "005_create_stok_table", SQL: Migration005CreateStokTable},
	{ID: "006_create_pembelian_table", SQL: Migration006CreatePembelianTable},
	{ID: "007_create_penjualan_table", SQL: Migration007CreatePenjualanTable},
	{ID: "008_create_resep_table", SQL: Migration008CreateResepTable},
	{ID: "009_create_notifikasi_settings_table", SQL: Migration009CreateNotifikasiSettingsTable},
	{ID: "010_add_payment_gateway", SQL: Migration010AddPaymentGateway},
}
