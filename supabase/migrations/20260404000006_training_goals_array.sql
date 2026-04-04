-- Change training_goal (single text) → training_goals (text array)
-- so users can combine goals like "muscle_gain" + "weight_loss"

-- 1. Add new array column
alter table person_preferences
  add column training_goals text[] not null default '{}';

-- 2. Migrate existing single-goal data into the new array
update person_preferences
  set training_goals = array[training_goal]
  where training_goal is not null;

-- 3. Keep training_goal column for now (will drop in future when fully migrated)
--    (no drop so existing code that reads it doesn't break immediately)
