package seeders

type Seeder struct {
	ID  string
	SQL string
}

var All = []Seeder{
	{ID: "role_seeder", SQL: RoleSeederSQL},
	{ID: "cabang_seeder", SQL: CabangSeederSQL},
	{ID: "golongan_obat_seeder", SQL: GolonganObatSeederSQL},
	{ID: "satuan_seeder", SQL: SatuanSeederSQL},
	{ID: "admin_seeder", SQL: AdminSeederSQL},
	{ID: "barang_seeder", SQL: BarangSeederSQL},
}
