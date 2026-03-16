-- Add detailed tax impact columns to bank_transactions
-- For TASK-017c: detailed tax impact of missing documents
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS social_impact NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS health_impact NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS total_impact NUMERIC(12, 2) DEFAULT 0;
