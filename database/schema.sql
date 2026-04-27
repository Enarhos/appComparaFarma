-- ============================================================
-- appFarmacy - Esquema de base de datos (MySQL)
-- ============================================================

CREATE TABLE IF NOT EXISTS medications (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  active_ingredient VARCHAR(255),
  concentration    VARCHAR(100),
  form             VARCHAR(100),
  laboratory       VARCHAR(255),
  isp_registration VARCHAR(50),
  is_bioequivalent TINYINT(1) DEFAULT 0,
  created_at       DATETIME DEFAULT NOW(),
  updated_at       DATETIME DEFAULT NOW() ON UPDATE NOW(),
  FULLTEXT idx_search (name, active_ingredient)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pharmacies (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(50)  NOT NULL UNIQUE,
  logo_url    VARCHAR(500),
  website_url VARCHAR(500),
  scrape_url  VARCHAR(500),
  is_active   TINYINT(1) DEFAULT 1,
  created_at  DATETIME DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pharmacy_branches (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  pharmacy_id INT,
  name        VARCHAR(255),
  address     VARCHAR(500),
  commune     VARCHAR(100),
  region      VARCHAR(100),
  latitude    DECIMAL(10, 8),
  longitude   DECIMAL(11, 8),
  phone       VARCHAR(50),
  is_active   TINYINT(1) DEFAULT 1,
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS prices (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  medication_id       INT,
  pharmacy_id         INT,
  price               DECIMAL(10, 2) NOT NULL,   -- precio presencial (tienda)
  online_price        DECIMAL(10, 2) NULL,        -- precio web/internet
  cmr_price           DECIMAL(10, 2) NULL,        -- precio tarjeta CMR (Salcobrand/Falabella)
  has_stock           TINYINT(1) DEFAULT 1,
  has_online_delivery TINYINT(1) DEFAULT 0,
  online_url          VARCHAR(500),
  scraped_at          DATETIME DEFAULT NOW(),
  FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
  FOREIGN KEY (pharmacy_id)  REFERENCES pharmacies(id)  ON DELETE CASCADE,
  INDEX idx_medication_pharmacy (medication_id, pharmacy_id),
  INDEX idx_scraped_at (scraped_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bioequivalents (
  id                          INT AUTO_INCREMENT PRIMARY KEY,
  original_medication_id      INT,
  bioequivalent_medication_id INT,
  created_at                  DATETIME DEFAULT NOW(),
  FOREIGN KEY (original_medication_id)      REFERENCES medications(id) ON DELETE CASCADE,
  FOREIGN KEY (bioequivalent_medication_id) REFERENCES medications(id) ON DELETE CASCADE,
  UNIQUE KEY uq_bioequivalent (original_medication_id, bioequivalent_medication_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Farmacias iniciales
INSERT IGNORE INTO pharmacies (name, slug, website_url, scrape_url) VALUES
  ('Cruz Verde', 'cruz-verde', 'https://www.cruzverde.cl',         'https://www.cruzverde.cl'),
  ('Salcobrand', 'salcobrand', 'https://salcobrand.cl',            'https://salcobrand.cl'),
  ('Ahumada',    'ahumada',    'https://www.farmaciasahumada.cl',  'https://www.farmaciasahumada.cl'),
  ('Dr. Simi',   'dr-simi',   'https://www.farmaciasimilares.cl', 'https://www.farmaciasimilares.cl');
