-- Migration: Add student profile editable fields
-- Description: Add phone, address, and emergency contact fields to students table
-- Date: 2025-12-12

-- Add new columns to students table if they don't exist
DO $$ 
BEGIN
  -- Phone number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='students' AND column_name='phone') THEN
    ALTER TABLE students ADD COLUMN phone VARCHAR(20);
  END IF;

  -- Address fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='students' AND column_name='street_address') THEN
    ALTER TABLE students ADD COLUMN street_address TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='students' AND column_name='city') THEN
    ALTER TABLE students ADD COLUMN city VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='students' AND column_name='state') THEN
    ALTER TABLE students ADD COLUMN state VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='students' AND column_name='postal_code') THEN
    ALTER TABLE students ADD COLUMN postal_code VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='students' AND column_name='country') THEN
    ALTER TABLE students ADD COLUMN country VARCHAR(100);
  END IF;

  -- Emergency contact fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='students' AND column_name='emergency_contact_name') THEN
    ALTER TABLE students ADD COLUMN emergency_contact_name VARCHAR(200);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='students' AND column_name='emergency_contact_phone') THEN
    ALTER TABLE students ADD COLUMN emergency_contact_phone VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='students' AND column_name='emergency_contact_relationship') THEN
    ALTER TABLE students ADD COLUMN emergency_contact_relationship VARCHAR(50);
  END IF;
END $$;

-- Add RLS policy for students to update their own profile
-- First, check if the policy exists and drop it to recreate with updated logic
DROP POLICY IF EXISTS "Students can update their own profile" ON students;

CREATE POLICY "Students can update their own profile"
ON students FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Comment to document editable fields
COMMENT ON COLUMN students.phone IS 'Student phone number - editable by student';
COMMENT ON COLUMN students.street_address IS 'Street address - editable by student';
COMMENT ON COLUMN students.city IS 'City - editable by student';
COMMENT ON COLUMN students.state IS 'State/Province - editable by student';
COMMENT ON COLUMN students.postal_code IS 'Postal/ZIP code - editable by student';
COMMENT ON COLUMN students.country IS 'Country - editable by student';
COMMENT ON COLUMN students.emergency_contact_name IS 'Emergency contact name - editable by student';
COMMENT ON COLUMN students.emergency_contact_phone IS 'Emergency contact phone - editable by student';
COMMENT ON COLUMN students.emergency_contact_relationship IS 'Emergency contact relationship - editable by student';
