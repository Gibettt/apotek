package migrations

type Migration struct {
	ID  string
	SQL string
}

var All = []Migration{
	{ID: "001_drop_legacy_schema", SQL: Migration001DropLegacySchema},
	{ID: "002_create_identity_tables", SQL: Migration002CreateIdentityTables},
	{ID: "003_create_partner_tables", SQL: Migration003CreatePartnerTables},
	{ID: "004_create_item_master_tables", SQL: Migration004CreateItemMasterTables},
	{ID: "005_create_inventory_tables", SQL: Migration005CreateInventoryTables},
	{ID: "006_create_purchasing_tables", SQL: Migration006CreatePurchasingTables},
	{ID: "007_create_sales_tables", SQL: Migration007CreateSalesTables},
	{ID: "008_create_finance_audit_tables", SQL: Migration008CreateFinanceAuditTables},
	{ID: "009_create_notifikasi_pengaturan_tables", SQL: Migration009CreateNotifikasiPengaturanTables},
	{ID: "010_create_payment_function", SQL: Migration010CreatePaymentFunction},
}
