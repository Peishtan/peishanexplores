
-- Add route column to activities
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS route text;

-- Create benchmark_type enum
DO $$ BEGIN
  CREATE TYPE public.benchmark_type AS ENUM ('500m_row', '1000m_row', 'pushups_1m', 'situps_1m', 'plank_time');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create benchmarks table
CREATE TABLE public.benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_id public.benchmark_type NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  result TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own benchmarks" ON public.benchmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own benchmarks" ON public.benchmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own benchmarks" ON public.benchmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own benchmarks" ON public.benchmarks FOR DELETE USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_benchmarks_updated_at
  BEFORE UPDATE ON public.benchmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
