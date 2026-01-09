ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_type VARCHAR(20);

CREATE TABLE IF NOT EXISTS passwords (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  site_url TEXT NOT NULL,
  site_name VARCHAR(255),
  username VARCHAR(255),
  encrypted_password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  document_type VARCHAR(50) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  middle_name VARCHAR(255),
  birth_date DATE,
  passport_number VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(50),
  country VARCHAR(100),
  apartment VARCHAR(50),
  qr_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_codes_email ON email_verification_codes(email);

CREATE TABLE IF NOT EXISTS statistics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action_type VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_statistics_user_id ON statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_statistics_action_type ON statistics(action_type);
CREATE INDEX IF NOT EXISTS idx_statistics_created_at ON statistics(created_at);