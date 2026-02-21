-- Migration: Unified daily check-in with sleep and habits
-- Date: 2025-02-18
-- Purpose: Consolidate feelings, sleep, and habits into one daily check-in

-- Create daily_feelings table (if not exists)
CREATE TABLE IF NOT EXISTS daily_feelings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Core feelings
  feeling_score INTEGER NOT NULL CHECK (feeling_score >= 1 AND feeling_score <= 10),
  energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 10),
  
  -- Sleep (merged from sleep tracker)
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  sleep_duration_hours NUMERIC,
  
  -- Quick habits (merged from habit tracker)
  completed_habits TEXT[], -- Array of habit IDs: ['moved', 'hydrated', 'rested']
  
  -- Optional
  notes TEXT,
  mood TEXT, -- 'stressed' | 'calm' | 'energized' | 'tired'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One check-in per user per day
  UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_feelings_user_id ON daily_feelings(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_feelings_user_date ON daily_feelings(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_feelings_date ON daily_feelings(date);

-- RLS policies
ALTER TABLE daily_feelings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own feelings
CREATE POLICY daily_feelings_select_policy ON daily_feelings
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own feelings
CREATE POLICY daily_feelings_insert_policy ON daily_feelings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own feelings
CREATE POLICY daily_feelings_update_policy ON daily_feelings
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own feelings
CREATE POLICY daily_feelings_delete_policy ON daily_feelings
  FOR DELETE USING (auth.uid() = user_id);

-- Function: Get user's feeling for today
CREATE OR REPLACE FUNCTION get_today_feeling(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  feeling_score INTEGER,
  energy_level INTEGER,
  sleep_quality INTEGER,
  completed_habits TEXT[],
  date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    df.id,
    df.feeling_score,
    df.energy_level,
    df.sleep_quality,
    df.completed_habits,
    df.date
  FROM daily_feelings df
  WHERE df.user_id = p_user_id
    AND df.date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's weekly feelings
CREATE OR REPLACE FUNCTION get_weekly_feelings(p_user_id UUID)
RETURNS TABLE (
  date DATE,
  feeling_score INTEGER,
  energy_level INTEGER,
  sleep_quality INTEGER,
  completed_habits_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    df.date,
    df.feeling_score,
    df.energy_level,
    df.sleep_quality,
    COALESCE(array_length(df.completed_habits, 1), 0) as completed_habits_count
  FROM daily_feelings df
  WHERE df.user_id = p_user_id
    AND df.date >= CURRENT_DATE - INTERVAL '7 days'
  ORDER BY df.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's average feelings this week
CREATE OR REPLACE FUNCTION get_weekly_averages(p_user_id UUID)
RETURNS TABLE (
  avg_feeling NUMERIC,
  avg_energy NUMERIC,
  avg_sleep NUMERIC,
  total_days INTEGER,
  habits_consistency NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(df.feeling_score), 1) as avg_feeling,
    ROUND(AVG(df.energy_level), 1) as avg_energy,
    ROUND(AVG(df.sleep_quality), 1) as avg_sleep,
    COUNT(*)::INTEGER as total_days,
    ROUND(AVG(COALESCE(array_length(df.completed_habits, 1), 0)), 1) as habits_consistency
  FROM daily_feelings df
  WHERE df.user_id = p_user_id
    AND df.date >= CURRENT_DATE - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update updated_at on change
CREATE OR REPLACE FUNCTION update_daily_feelings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_feelings_updated_at_trigger
BEFORE UPDATE ON daily_feelings
FOR EACH ROW
EXECUTE FUNCTION update_daily_feelings_updated_at();

-- Comments for documentation
COMMENT ON TABLE daily_feelings IS 'Unified daily check-in: feelings, sleep, and quick habits';
COMMENT ON COLUMN daily_feelings.feeling_score IS 'How user feels overall (1-10)';
COMMENT ON COLUMN daily_feelings.energy_level IS 'Energy level (1-10)';
COMMENT ON COLUMN daily_feelings.sleep_quality IS 'Sleep quality from previous night (1-10)';
COMMENT ON COLUMN daily_feelings.completed_habits IS 'Array of habit IDs completed today';

-- Verify the migration
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'daily_feelings'
ORDER BY ordinal_position;
