-- Add medical_exam_due column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS medical_exam_due DATE;
