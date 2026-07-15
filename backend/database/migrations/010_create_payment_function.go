package migrations

var Migration010CreatePaymentFunction = `
CREATE OR REPLACE FUNCTION finalize_accurate_payment(
  p_external_id VARCHAR,
  p_provider_payment_id VARCHAR
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sale penjualan%ROWTYPE;
  detail RECORD;
  v_new_qty NUMERIC;
BEGIN
  SELECT * INTO sale
  FROM penjualan
  WHERE payment_external_id = p_external_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment reference not found';
  END IF;

  IF sale.payment_status = 'PAID' THEN
    RETURN sale.id::TEXT;
  END IF;

  IF sale.payment_status <> 'PENDING' THEN
    RAISE EXCEPTION 'payment cannot be finalized from status %', sale.payment_status;
  END IF;

  FOR detail IN
    SELECT * FROM penjualan_detail WHERE penjualan_id = sale.id
  LOOP
    UPDATE saldo_stok
    SET qty = qty - detail.qty
    WHERE cabang_id = sale.cabang_id
      AND barang_id = detail.barang_id
      AND (batch_id = detail.batch_id OR (batch_id IS NULL AND detail.batch_id IS NULL))
    RETURNING qty INTO v_new_qty;

    IF NOT FOUND THEN
      v_new_qty := -detail.qty;
      INSERT INTO saldo_stok (cabang_id, barang_id, batch_id, qty)
      VALUES (sale.cabang_id, detail.barang_id, detail.batch_id, v_new_qty);
    END IF;

    INSERT INTO kartu_stok (
      tanggal, cabang_id, barang_id, batch_id, tipe_mutasi,
      sumber_tabel, sumber_id, qty_masuk, qty_keluar, saldo_akhir, harga_pokok
    ) VALUES (
      NOW(), sale.cabang_id, detail.barang_id, detail.batch_id, 'keluar',
      'penjualan', sale.id, 0, detail.qty, v_new_qty, detail.harga_pokok
    );
  END LOOP;

  INSERT INTO pembayaran (penjualan_id, metode, jumlah, nomor_referensi, waktu_bayar)
  VALUES (sale.id, COALESCE(sale.payment_provider, 'gateway'), sale.grand_total, p_provider_payment_id, NOW());

  UPDATE penjualan
  SET
    status = 'selesai',
    status_bayar = 'lunas',
    bayar_total = grand_total,
    kembalian = 0,
    payment_status = 'PAID',
    payment_transaction_id = p_provider_payment_id
  WHERE id = sale.id;

  RETURN sale.id::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION finalize_accurate_payment(VARCHAR, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finalize_accurate_payment(VARCHAR, VARCHAR) TO service_role;
`
