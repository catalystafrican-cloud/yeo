-- Migration: Add student strikes and appeals tables
-- Description: Create tables for student disciplinary strikes and their appeals
-- Date: 2025-12-12

-- Create student_strikes table (if not exists)
CREATE TABLE IF NOT EXISTS student_strikes (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'Minor', -- 'Minor', 'Major', 'Severe'
  issued_by UUID REFERENCES user_profiles(id),
  issued_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  archived BOOLEAN DEFAULT FALSE, -- For soft deletion / strike resetting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create strike_appeals table
CREATE TABLE IF NOT EXISTS strike_appeals (
  id SERIAL PRIMARY KEY,
  strike_id INTEGER NOT NULL REFERENCES student_strikes(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  appeal_reason TEXT NOT NULL,
  supporting_details TEXT,
  status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Under Review', 'Approved', 'Rejected'
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_student_strikes_student ON student_strikes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_strikes_school ON student_strikes(school_id);
CREATE INDEX IF NOT EXISTS idx_student_strikes_archived ON student_strikes(archived);
CREATE INDEX IF NOT EXISTS idx_strike_appeals_strike ON strike_appeals(strike_id);
CREATE INDEX IF NOT EXISTS idx_strike_appeals_student ON strike_appeals(student_id);
CREATE INDEX IF NOT EXISTS idx_strike_appeals_status ON strike_appeals(status);

-- Enable Row Level Security
ALTER TABLE student_strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE strike_appeals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_strikes
-- Policy: Students can view their own strikes (non-archived only)
CREATE POLICY "Students can view their own strikes"
ON student_strikes FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
  AND archived = FALSE
);

-- Policy: Staff can view all strikes for their school
CREATE POLICY "Staff can view all strikes for their school"
ON student_strikes FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM user_profiles WHERE id = auth.uid()
  )
);

-- Policy: Staff can create strikes
CREATE POLICY "Staff can create strikes"
ON student_strikes FOR INSERT
WITH CHECK (
  school_id IN (
    SELECT school_id FROM user_profiles WHERE id = auth.uid()
  )
);

-- Policy: Staff can update strikes (for archiving)
CREATE POLICY "Staff can update strikes"
ON student_strikes FOR UPDATE
USING (
  school_id IN (
    SELECT school_id FROM user_profiles WHERE id = auth.uid()
  )
);

-- RLS Policies for strike_appeals
-- Policy: Students can view their own appeals
CREATE POLICY "Students can view their own appeals"
ON strike_appeals FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Policy: Students can create appeals for their strikes
CREATE POLICY "Students can create their own appeals"
ON strike_appeals FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
  AND strike_id IN (
    SELECT id FROM student_strikes WHERE student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Staff can view all appeals for their school
CREATE POLICY "Staff can view all appeals for their school"
ON strike_appeals FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE school_id IN (
      SELECT school_id FROM user_profiles WHERE id = auth.uid()
    )
  )
);

-- Policy: Staff can update appeals (for reviewing)
CREATE POLICY "Staff can update appeals for their school"
ON strike_appeals FOR UPDATE
USING (
  student_id IN (
    SELECT id FROM students WHERE school_id IN (
      SELECT school_id FROM user_profiles WHERE id = auth.uid()
    )
  )
);

-- Trigger to update updated_at timestamp for strikes
CREATE OR REPLACE FUNCTION update_student_strikes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_student_strikes_updated_at
  BEFORE UPDATE ON student_strikes
  FOR EACH ROW
  EXECUTE FUNCTION update_student_strikes_updated_at();

-- Trigger to update updated_at timestamp for appeals
CREATE OR REPLACE FUNCTION update_strike_appeals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_strike_appeals_updated_at
  BEFORE UPDATE ON strike_appeals
  FOR EACH ROW
  EXECUTE FUNCTION update_strike_appeals_updated_at();
