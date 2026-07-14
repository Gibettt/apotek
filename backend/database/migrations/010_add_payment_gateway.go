package migrations

var Migration010AddPaymentGateway = `
ALTER TABLE penjualan
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(30),
  ADD COLUMN IF NOT EXISTS payment_external_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS payment_provider_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS payment_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30),
  ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accurate_invoice_id BIGINT,
  ADD COLUMN IF NOT EXISTS accurate_sync_status VARCHAR(30),
  ADD COLUMN IF NOT EXISTS accurate_sync_error TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS penjualan_payment_external_id_unique
  ON penjualan(payment_external_id)
  WHERE payment_external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS penjualan_payment_status_index
  ON penjualan(payment_status);

CREATE OR REPLACE FUNCTION finalize_accurate_payment(
  p_external_id VARCHAR,
  p_provider_payment_id VARCHAR
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sale penjualan%ROWTYPE;
BEGIN
  SELECT * INTO sale
  FROM penjualan
  WHERE payment_external_id = p_external_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment reference not found';
  END IF;

  IF sale.payment_status = 'PAID' THEN
    RETURN sale.id;
  END IF;

  IF sale.payment_status <> 'PENDING' THEN
    RAISE EXCEPTION 'payment cannot be finalized from status %', sale.payment_status;
  END IF;

  INSERT INTO stok (obat_id, batch_number, tanggal_expired, jumlah, lokasi)
  SELECT
    detail.obat_id,
    'OUT-' || sale.nomor_penjualan || '-' || detail.obat_id,
    NULL,
    -detail.jumlah,
    'Kasir'
  FROM penjualan_detail AS detail
  WHERE detail.penjualan_id = sale.id;

  UPDATE penjualan
  SET
    status = 'selesai',
    payment_status = 'PAID',
    payment_transaction_id = p_provider_payment_id,
    bayar = total,
    kembalian = 0
  WHERE id = sale.id;

  RETURN sale.id;
END;
$$;

REVOKE ALL ON FUNCTION finalize_accurate_payment(VARCHAR, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finalize_accurate_payment(VARCHAR, VARCHAR) TO service_role;
`
