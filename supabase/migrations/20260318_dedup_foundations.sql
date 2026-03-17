-- TASK-024: Deduplication foundations
-- Unique indexes on users + structured contact columns on insurance_cases

-- 1. UNIQUE index on users.email (partial — only non-null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
  ON users (lower(email))
  WHERE email IS NOT NULL;

-- 2. UNIQUE index on users.login_name (partial — only non-null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_name_unique
  ON users (lower(login_name))
  WHERE login_name IS NOT NULL;

-- 3. Add phone column to users (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_phone
  ON users (phone)
  WHERE phone IS NOT NULL;

-- 4. Add structured contact columns to insurance_cases
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insurance_cases' AND column_name = 'contact_name'
  ) THEN
    ALTER TABLE insurance_cases ADD COLUMN contact_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insurance_cases' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE insurance_cases ADD COLUMN contact_email TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insurance_cases' AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE insurance_cases ADD COLUMN contact_phone TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insurance_cases' AND column_name = 'contact_user_id'
  ) THEN
    ALTER TABLE insurance_cases ADD COLUMN contact_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Composite index for duplicate detection (email + insurance_company + recency)
CREATE INDEX IF NOT EXISTS idx_insurance_cases_contact_dedup
  ON insurance_cases (contact_email, insurance_company_id, created_at)
  WHERE contact_email IS NOT NULL;

-- 6. Index on contact_user_id for FK lookups
CREATE INDEX IF NOT EXISTS idx_insurance_cases_contact_user
  ON insurance_cases (contact_user_id)
  WHERE contact_user_id IS NOT NULL;
