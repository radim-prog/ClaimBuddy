-- Fix: add ON DELETE CASCADE to onboarding_questionnaires.company_id FK
-- When a company is deleted, its questionnaires should be removed too

ALTER TABLE onboarding_questionnaires
  DROP CONSTRAINT IF EXISTS onboarding_questionnaires_company_id_fkey;

ALTER TABLE onboarding_questionnaires
  ADD CONSTRAINT onboarding_questionnaires_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
