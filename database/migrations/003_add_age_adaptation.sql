-- Add age-related columns to users table
ALTER TABLE users ADD COLUMN birth_date DATE;
ALTER TABLE users ADD COLUMN age_group VARCHAR(20) DEFAULT 'adult' CHECK (age_group IN ('child', 'teen', 'adult'));
ALTER TABLE users ADD COLUMN content_preferences JSONB DEFAULT '{}';

-- Create age adaptation settings table
CREATE TABLE age_adaptation_settings (
    id SERIAL PRIMARY KEY,
    age_group VARCHAR(20) NOT NULL CHECK (age_group IN ('child', 'teen', 'adult')),
    setting_category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(age_group, setting_category, setting_key)
);

-- Insert default age adaptation settings
INSERT INTO age_adaptation_settings (age_group, setting_category, setting_key, setting_value) VALUES
-- Child settings
('child', 'language', 'complexity', '"simple"'),
('child', 'language', 'vocabulary', '"basic"'),
('child', 'language', 'tone', '"encouraging"'),
('child', 'exercises', 'max_duration', '15'),
('child', 'exercises', 'max_questions', '5'),
('child', 'exercises', 'types', '["drag_drop", "matching", "coloring", "simple_quiz"]'),
('child', 'gamification', 'points_multiplier', '2.0'),
('child', 'gamification', 'celebration_style', '"high_energy"'),
('child', 'ui', 'color_scheme', '"bright"'),
('child', 'ui', 'font_size', '"large"'),

-- Teen settings  
('teen', 'language', 'complexity', '"intermediate"'),
('teen', 'language', 'vocabulary', '"expanding"'),
('teen', 'language', 'tone', '"motivational"'),
('teen', 'exercises', 'max_duration', '25'),
('teen', 'exercises', 'max_questions', '10'),
('teen', 'exercises', 'types', '["multiple_choice", "fill_blanks", "coding_challenges", "projects"]'),
('teen', 'gamification', 'points_multiplier', '1.5'),
('teen', 'gamification', 'celebration_style', '"motivational"'),
('teen', 'ui', 'color_scheme', '"modern"'),
('teen', 'ui', 'font_size', '"medium"'),

-- Adult settings
('adult', 'language', 'complexity', '"advanced"'),
('adult', 'language', 'vocabulary', '"comprehensive"'),
('adult', 'language', 'tone', '"professional"'),
('adult', 'exercises', 'max_duration', '45'),
('adult', 'exercises', 'max_questions', '15'),
('adult', 'exercises', 'types', '["case_studies", "simulations", "research_projects", "presentations"]'),
('adult', 'gamification', 'points_multiplier', '1.0'),
('adult', 'gamification', 'celebration_style', '"professional"'),
('adult', 'ui', 'color_scheme', '"professional"'),
('adult', 'ui', 'font_size', '"standard"');

-- Create age-adapted content table
CREATE TABLE age_adapted_content (
    id SERIAL PRIMARY KEY,
    original_content_id INTEGER NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    age_group VARCHAR(20) NOT NULL CHECK (age_group IN ('child', 'teen', 'adult')),
    adapted_title TEXT,
    adapted_description TEXT,
    adapted_instructions TEXT,
    adapted_exercises JSONB DEFAULT '{}',
    adaptation_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(original_content_id, content_type, age_group)
);

-- Add indexes for performance
CREATE INDEX idx_users_age_group ON users(age_group);
CREATE INDEX idx_users_birth_date ON users(birth_date);
CREATE INDEX idx_age_adaptation_settings_lookup ON age_adaptation_settings(age_group, setting_category);
CREATE INDEX idx_age_adapted_content_lookup ON age_adapted_content(content_type, age_group);

-- Update existing users with default age group based on email patterns
UPDATE users SET age_group = 'adult' WHERE age_group IS NULL;

COMMENT ON TABLE age_adaptation_settings IS 'Stores configuration settings for different age groups';
COMMENT ON TABLE age_adapted_content IS 'Stores age-adapted versions of educational content';
COMMENT ON COLUMN users.birth_date IS 'User birth date for age calculation';
COMMENT ON COLUMN users.age_group IS 'Calculated age group: child (7-12), teen (13-18), adult (19+)';
COMMENT ON COLUMN users.content_preferences IS 'User-specific content adaptation preferences';