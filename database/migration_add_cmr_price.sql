-- Agrega columna cmr_price a tabla prices
ALTER TABLE prices ADD COLUMN IF NOT EXISTS cmr_price DECIMAL(10,2) NULL AFTER online_price;
