-- Seed default folder templates (predefined structure for all clients)
-- These will be auto-provisioned to existing companies on first folder tree access

INSERT INTO document_folder_templates (name, slug, icon, entity_types, is_mandatory, sort_order, has_period_filter, auto_ocr)
VALUES
  ('Faktury přijaté', 'faktury-prijate', 'file-text', '{osvc,sro,as}', true, 10, true, true),
  ('Faktury vydané', 'faktury-vydane', 'file-output', '{osvc,sro,as}', true, 20, true, false),
  ('Výpisy z účtu', 'vypisy-z-uctu', 'landmark', '{osvc,sro,as}', true, 30, true, false),
  ('Smlouvy', 'smlouvy', 'file-signature', '{osvc,sro,as}', false, 40, false, false),
  ('Mzdy', 'mzdy', 'users', '{sro,as}', false, 50, true, false),
  ('Pojistné smlouvy', 'pojistne-smlouvy', 'shield', '{osvc,sro,as}', false, 60, false, false),
  ('Daňová přiznání', 'danova-priznani', 'calculator', '{osvc,sro,as}', false, 70, false, false),
  ('Ostatní', 'ostatni', 'folder', '{osvc,sro,as}', false, 80, false, false)
ON CONFLICT DO NOTHING;

-- Add unique constraint on document_folders for template provisioning dedup
-- (company_id + template_id must be unique to prevent double-provisioning)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'document_folders_company_template_unique'
  ) THEN
    ALTER TABLE document_folders
      ADD CONSTRAINT document_folders_company_template_unique
      UNIQUE (company_id, template_id);
  END IF;
END $$;
