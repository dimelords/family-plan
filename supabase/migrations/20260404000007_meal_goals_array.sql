-- Change meal_goal (single text) → meal_goals (text array)
-- mirrors the training_goals change so users can combine e.g. weight_loss + muscle_gain

alter table person_preferences
  add column meal_goals text[] not null default '{}';

update person_preferences
  set meal_goals = array[meal_goal]
  where meal_goal is not null;
