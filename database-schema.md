-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievement_series (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  series_name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT achievement_series_pkey PRIMARY KEY (id)
);
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  icon text,
  xp_reward integer NOT NULL DEFAULT 0,
  tier text CHECK (tier = ANY (ARRAY['bronze'::text, 'silver'::text, 'gold'::text, 'platinum'::text])),
  category text CHECK (category = ANY (ARRAY['workout'::text, 'nutrition'::text, 'consistency'::text, 'milestone'::text])),
  criteria jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  series_id uuid,
  series_order integer,
  is_hidden boolean DEFAULT false,
  prerequisite_achievement_id uuid,
  CONSTRAINT achievements_pkey PRIMARY KEY (id),
  CONSTRAINT achievements_series_id_fkey FOREIGN KEY (series_id) REFERENCES public.achievement_series(id),
  CONSTRAINT achievements_prerequisite_achievement_id_fkey FOREIGN KEY (prerequisite_achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.ai_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  context_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_archived boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  closed_at timestamp with time zone,
  CONSTRAINT ai_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT ai_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.ai_memory_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  memory_type text NOT NULL,
  value jsonb NOT NULL,
  confidence numeric DEFAULT 1.0,
  source text NOT NULL CHECK (source = ANY (ARRAY['user'::text, 'derived'::text])),
  is_active boolean DEFAULT true,
  superseded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_memory_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT ai_memory_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.ai_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])),
  content text NOT NULL,
  structured_payload jsonb,
  token_count integer,
  model_used text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ai_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id)
);
CREATE TABLE public.body_weight_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  weight_kg numeric NOT NULL,
  recorded_at timestamp with time zone DEFAULT now(),
  source text DEFAULT 'manual'::text CHECK (source = ANY (ARRAY['manual'::text, 'scale'::text, 'import'::text])),
  CONSTRAINT body_weight_logs_pkey PRIMARY KEY (id),
  CONSTRAINT body_weight_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.community_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT community_blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES auth.users(id),
  CONSTRAINT community_blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES auth.users(id)
);
CREATE TABLE public.community_challenge_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL,
  user_id uuid NOT NULL,
  current_progress numeric DEFAULT 0,
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  division text,
  joined_at timestamp with time zone DEFAULT now(),
  last_activity_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_challenge_participants_pkey PRIMARY KEY (id),
  CONSTRAINT community_challenge_participants_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.community_challenges(id),
  CONSTRAINT community_challenge_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.community_challenge_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  challenge_participant_id uuid NOT NULL,
  submission_type text NOT NULL CHECK (submission_type = ANY (ARRAY['video'::text, 'photo'::text, 'text'::text, 'auto'::text])),
  media_urls ARRAY,
  notes text,
  value numeric NOT NULL,
  verification_status text DEFAULT 'pending'::text CHECK (verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text])),
  verified_by uuid,
  verified_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_challenge_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT community_challenge_submissions_challenge_participant_id_fkey FOREIGN KEY (challenge_participant_id) REFERENCES public.community_challenge_participants(id),
  CONSTRAINT community_challenge_submissions_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id)
);
CREATE TABLE public.community_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  challenge_type text NOT NULL CHECK (challenge_type = ANY (ARRAY['rep_based'::text, 'time_based'::text, 'streak_based'::text, 'distance_based'::text, 'custom'::text])),
  target_value numeric,
  target_unit text,
  verification_type text NOT NULL DEFAULT 'honor'::text CHECK (verification_type = ANY (ARRAY['honor'::text, 'video'::text, 'photo'::text, 'auto'::text, 'peer'::text])),
  rules text,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  is_recurring boolean DEFAULT false,
  recurrence_pattern text,
  difficulty text CHECK (difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'all'::text])),
  tags ARRAY,
  is_public boolean DEFAULT true,
  max_participants integer,
  total_participants integer DEFAULT 0,
  status text DEFAULT 'upcoming'::text CHECK (status = ANY (ARRAY['draft'::text, 'upcoming'::text, 'active'::text, 'completed'::text, 'cancelled'::text])),
  is_official boolean DEFAULT false,
  xp_reward integer DEFAULT 0,
  badge_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_challenges_pkey PRIMARY KEY (id),
  CONSTRAINT community_challenges_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT community_challenges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.community_coach_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  program_type text NOT NULL CHECK (program_type = ANY (ARRAY['workout_plan'::text, 'nutrition_plan'::text, 'hybrid'::text, 'course'::text, 'consultation'::text])),
  duration_weeks integer,
  difficulty text CHECK (difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'all'::text])),
  tags ARRAY,
  price_amount numeric NOT NULL,
  currency text DEFAULT 'USD'::text,
  pricing_model text DEFAULT 'one_time'::text CHECK (pricing_model = ANY (ARRAY['one_time'::text, 'monthly'::text, 'weekly'::text])),
  thumbnail_url text,
  preview_video_url text,
  media_urls ARRAY,
  curriculum jsonb,
  total_sales integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  average_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_coach_programs_pkey PRIMARY KEY (id),
  CONSTRAINT community_coach_programs_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES auth.users(id)
);
CREATE TABLE public.community_comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_comment_likes_pkey PRIMARY KEY (id),
  CONSTRAINT community_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.community_comments(id),
  CONSTRAINT community_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.community_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  parent_comment_id uuid,
  body text NOT NULL,
  total_likes integer DEFAULT 0,
  is_flagged boolean DEFAULT false,
  is_hidden boolean DEFAULT false,
  flag_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT community_comments_pkey PRIMARY KEY (id),
  CONSTRAINT community_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id),
  CONSTRAINT community_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT community_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.community_comments(id)
);
CREATE TABLE public.community_feed_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  event_type text CHECK (event_type = ANY (ARRAY['like'::text, 'comment'::text, 'share'::text, 'report'::text])),
  actor_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_feed_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.community_feed_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL,
  author_id uuid NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  source text DEFAULT 'follow'::text CHECK (source = ANY (ARRAY['follow'::text, 'global'::text, 'challenge'::text, 'coach'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_feed_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.community_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_follows_pkey PRIMARY KEY (id),
  CONSTRAINT community_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id),
  CONSTRAINT community_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id)
);
CREATE TABLE public.community_leaderboard_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  leaderboard_type text NOT NULL CHECK (leaderboard_type = ANY (ARRAY['overall_xp'::text, 'workout_streak'::text, 'challenge_wins'::text, 'consistency'::text, 'strength_gains'::text])),
  division text,
  rank integer NOT NULL,
  score numeric NOT NULL,
  period_type text NOT NULL CHECK (period_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'all_time'::text, 'rolling_30'::text])),
  period_start date NOT NULL,
  period_end date NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  calculated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_leaderboard_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT community_leaderboard_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.community_moderation_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL CHECK (action_type = ANY (ARRAY['warning'::text, 'temp_ban'::text, 'permanent_ban'::text, 'content_restriction'::text])),
  reason text NOT NULL,
  duration_hours integer,
  actioned_by uuid,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_moderation_actions_pkey PRIMARY KEY (id),
  CONSTRAINT community_moderation_actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT community_moderation_actions_actioned_by_fkey FOREIGN KEY (actioned_by) REFERENCES auth.users(id)
);
CREATE TABLE public.community_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['like'::text, 'comment'::text, 'follow'::text, 'mention'::text, 'challenge_invite'::text, 'challenge_complete'::text, 'program_purchase'::text, 'review'::text, 'milestone'::text])),
  title text NOT NULL,
  body text,
  actor_id uuid,
  reference_type text,
  reference_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT community_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT community_notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id)
);
CREATE TABLE public.community_post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_post_likes_pkey PRIMARY KEY (id),
  CONSTRAINT community_post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id),
  CONSTRAINT community_post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.community_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['text'::text, 'image'::text, 'video'::text, 'progress'::text, 'form_check'::text, 'question'::text, 'achievement'::text])),
  title text,
  body text NOT NULL,
  media_urls ARRAY,
  tags ARRAY,
  is_beginner_question boolean DEFAULT false,
  workout_session_id uuid,
  achievement_id uuid,
  total_likes integer DEFAULT 0,
  total_comments integer DEFAULT 0,
  total_shares integer DEFAULT 0,
  is_flagged boolean DEFAULT false,
  is_hidden boolean DEFAULT false,
  flag_count integer DEFAULT 0,
  moderation_status text DEFAULT 'approved'::text CHECK (moderation_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'under_review'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  hot_score numeric DEFAULT 0,
  CONSTRAINT community_posts_pkey PRIMARY KEY (id),
  CONSTRAINT community_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT community_posts_workout_session_id_fkey FOREIGN KEY (workout_session_id) REFERENCES public.workout_sessions(id),
  CONSTRAINT community_posts_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.community_program_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  user_id uuid NOT NULL,
  purchase_price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  transaction_id text,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text, 'refunded'::text])),
  access_granted_at timestamp with time zone DEFAULT now(),
  access_expires_at timestamp with time zone,
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  current_week integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_program_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT community_program_enrollments_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.community_coach_programs(id),
  CONSTRAINT community_program_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.community_program_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  user_id uuid NOT NULL,
  enrollment_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text NOT NULL,
  coach_response text,
  coach_responded_at timestamp with time zone,
  helpful_count integer DEFAULT 0,
  total_reactions integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_program_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT community_program_reviews_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.community_coach_programs(id),
  CONSTRAINT community_program_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT community_program_reviews_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.community_program_enrollments(id)
);
CREATE TABLE public.community_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_type text NOT NULL CHECK (reported_type = ANY (ARRAY['post'::text, 'comment'::text, 'user'::text, 'challenge'::text, 'program'::text])),
  reported_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason = ANY (ARRAY['spam'::text, 'harassment'::text, 'inappropriate_content'::text, 'misinformation'::text, 'dangerous_advice'::text, 'impersonation'::text, 'other'::text])),
  description text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'under_review'::text, 'resolved'::text, 'dismissed'::text])),
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  resolution_notes text,
  action_taken text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_reports_pkey PRIMARY KEY (id),
  CONSTRAINT community_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id),
  CONSTRAINT community_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.community_user_interests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  interest_tag text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_user_interests_pkey PRIMARY KEY (id),
  CONSTRAINT community_user_interests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.dm_conversation_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  last_read_at timestamp with time zone,
  is_muted boolean DEFAULT false,
  CONSTRAINT dm_conversation_members_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dm_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  last_message_at timestamp with time zone,
  CONSTRAINT dm_conversations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exercise_aliases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL,
  alias text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  relevance_score integer DEFAULT 0,
  CONSTRAINT exercise_aliases_pkey PRIMARY KEY (id),
  CONSTRAINT exercise_aliases_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);
CREATE TABLE public.exercise_muscle_mapping (
  id integer NOT NULL DEFAULT nextval('exercise_muscle_mapping_id_seq'::regclass),
  exercise_name character varying NOT NULL,
  muscle_group character varying NOT NULL,
  coefficient numeric NOT NULL CHECK (coefficient >= 0.10 AND coefficient <= 1.00),
  CONSTRAINT exercise_muscle_mapping_pkey PRIMARY KEY (id),
  CONSTRAINT fk_exercise_name FOREIGN KEY (exercise_name) REFERENCES public.exercises(name)
);
CREATE TABLE public.exercise_muscles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL,
  muscle text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['primary'::text, 'secondary'::text, 'stabilizer'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exercise_muscles_pkey PRIMARY KEY (id),
  CONSTRAINT exercise_muscles_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);
CREATE TABLE public.exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  primary_body_part text,
  equipment text,
  is_custom boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_public boolean DEFAULT false,
  search_vector tsvector DEFAULT to_tsvector('english'::regconfig, name),
  deleted_at timestamp with time zone,
  video_url text,
  thumbnail_url text,
  difficulty_level text CHECK (difficulty_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])),
  source text DEFAULT 'official'::text,
  exercise_type text CHECK (exercise_type = ANY (ARRAY['strength'::text, 'cardio'::text, 'bodybuilding'::text, 'calisthenics'::text, 'mobility'::text])),
  CONSTRAINT exercises_pkey PRIMARY KEY (id),
  CONSTRAINT exercises_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.foods (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  calories_per_100g integer NOT NULL,
  protein_g_per_100g double precision NOT NULL,
  carbs_g_per_100g double precision NOT NULL,
  fat_g_per_100g double precision NOT NULL,
  fiber_g_per_100g double precision,
  source text DEFAULT 'system'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  description text,
  brand text,
  category text,
  CONSTRAINT foods_pkey PRIMARY KEY (id)
);
CREATE TABLE public.habit_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL,
  user_id uuid NOT NULL,
  completion_date date NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  progress_pct integer CHECK (progress_pct >= 0 AND progress_pct <= 100),
  logged_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT habit_completions_pkey PRIMARY KEY (id),
  CONSTRAINT habit_completions_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.user_habits(id),
  CONSTRAINT habit_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.leaderboards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  leaderboard_type text NOT NULL CHECK (leaderboard_type = ANY (ARRAY['global_xp'::text, 'weekly_xp'::text, 'monthly_xp'::text, 'workout_streak'::text, 'achievements'::text])),
  time_period text NOT NULL CHECK (time_period = ANY (ARRAY['all_time'::text, 'monthly'::text, 'weekly'::text, 'daily'::text])),
  user_id uuid NOT NULL,
  rank integer NOT NULL,
  score bigint NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  period_start date NOT NULL,
  period_end date NOT NULL,
  calculated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leaderboards_pkey PRIMARY KEY (id),
  CONSTRAINT leaderboards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.meal_aliases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL,
  alias text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  relevance_score integer DEFAULT 0,
  CONSTRAINT meal_aliases_pkey PRIMARY KEY (id),
  CONSTRAINT meal_aliases_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id)
);
CREATE TABLE public.meal_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  meal_id uuid,
  food_id uuid,
  quantity_g double precision NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  calories double precision,
  protein_g double precision,
  carbs_g double precision,
  fat_g double precision,
  fiber_g double precision,
  custom_food_name text,
  CONSTRAINT meal_items_pkey PRIMARY KEY (id),
  CONSTRAINT meal_items_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id),
  CONSTRAINT meal_items_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(id)
);
CREATE TABLE public.meal_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL,
  tag text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT meal_tags_pkey PRIMARY KEY (id),
  CONSTRAINT meal_tags_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id)
);
CREATE TABLE public.meal_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  tags ARRAY DEFAULT '{}'::text[],
  estimated_calories integer,
  estimated_protein_g integer,
  estimated_carbs_g integer,
  estimated_fat_g integer,
  search_vector tsvector,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT meal_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.meals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  name text NOT NULL,
  description text,
  is_template boolean DEFAULT false,
  created_by text DEFAULT 'user'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  meal_type text CHECK (meal_type = ANY (ARRAY['breakfast'::text, 'lunch'::text, 'dinner'::text, 'snack'::text])),
  consumed_at timestamp with time zone NOT NULL DEFAULT now(),
  logged_via text DEFAULT 'manual'::text CHECK (logged_via = ANY (ARRAY['manual'::text, 'ai'::text, 'voice'::text, 'import'::text])),
  is_deleted boolean DEFAULT false,
  search_vector tsvector,
  image_uri text,
  CONSTRAINT meals_pkey PRIMARY KEY (id),
  CONSTRAINT meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.nutrition_daily_summary (
  user_id uuid NOT NULL,
  date date NOT NULL,
  calories integer NOT NULL,
  protein_g double precision NOT NULL,
  carbs_g double precision NOT NULL,
  fat_g double precision NOT NULL,
  fiber_g double precision,
  updated_at timestamp with time zone DEFAULT now(),
  last_calculated_at timestamp with time zone DEFAULT now(),
  calculation_source text DEFAULT 'trigger'::text CHECK (calculation_source = ANY (ARRAY['trigger'::text, 'batch'::text, 'manual'::text])),
  CONSTRAINT nutrition_daily_summary_pkey PRIMARY KEY (user_id, date),
  CONSTRAINT nutrition_daily_summary_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.nutrition_goals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  target_calories integer NOT NULL DEFAULT 2000,
  target_protein_g numeric DEFAULT 150,
  target_carbs_g numeric DEFAULT 250,
  target_fat_g numeric DEFAULT 65,
  target_fiber_g numeric DEFAULT 30,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT nutrition_goals_pkey PRIMARY KEY (id),
  CONSTRAINT nutrition_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone DEFAULT now(),
  date_of_birth date,
  gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'non_binary'::text, 'prefer_not_to_say'::text])),
  community_bio text,
  community_username text UNIQUE,
  is_coach boolean DEFAULT false,
  coach_verification_status text DEFAULT 'unverified'::text CHECK (coach_verification_status = ANY (ARRAY['unverified'::text, 'certified'::text, 'hira_verified'::text])),
  coach_specialties ARRAY,
  coach_credentials text,
  coach_hourly_rate numeric,
  total_followers integer DEFAULT 0,
  total_following integer DEFAULT 0,
  total_posts integer DEFAULT 0,
  community_joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.shop_cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  variant_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shop_cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT shop_cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT shop_cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.shop_variants(id)
);
CREATE TABLE public.shop_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_id uuid,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shop_categories_pkey PRIMARY KEY (id),
  CONSTRAINT shop_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.shop_categories(id)
);
CREATE TABLE public.shop_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  variant_id uuid,
  product_id uuid,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT shop_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT shop_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.shop_orders(id),
  CONSTRAINT shop_order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.shop_variants(id),
  CONSTRAINT shop_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.shop_products(id)
);
CREATE TABLE public.shop_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'fulfilled'::text, 'cancelled'::text, 'refunded'::text])),
  total_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  shipping_address jsonb,
  billing_address jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shop_orders_pkey PRIMARY KEY (id),
  CONSTRAINT shop_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.shop_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type = ANY (ARRAY['digital'::text, 'physical'::text])),
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'archived'::text])),
  images ARRAY DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shop_products_pkey PRIMARY KEY (id),
  CONSTRAINT shop_products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.shop_categories(id)
);
CREATE TABLE public.shop_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['payment'::text, 'refund'::text, 'authorization'::text, 'capture'::text, 'void'::text])),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  payment_provider text NOT NULL,
  provider_transaction_id text,
  status text NOT NULL CHECK (status = ANY (ARRAY['success'::text, 'failed'::text, 'pending'::text])),
  failure_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shop_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT shop_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.shop_orders(id)
);
CREATE TABLE public.shop_user_entitlements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  source_order_id uuid,
  source_variant_id uuid,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'revoked'::text, 'expired'::text])),
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  source_type text NOT NULL DEFAULT 'purchase'::text CHECK (source_type = ANY (ARRAY['purchase'::text, 'promo'::text, 'admin'::text, 'subscription'::text])),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT shop_user_entitlements_pkey PRIMARY KEY (id),
  CONSTRAINT shop_user_entitlements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT shop_user_entitlements_source_order_id_fkey FOREIGN KEY (source_order_id) REFERENCES public.shop_orders(id),
  CONSTRAINT shop_user_entitlements_source_variant_id_fkey FOREIGN KEY (source_variant_id) REFERENCES public.shop_variants(id)
);
CREATE TABLE public.shop_variant_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  quantity integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shop_variant_items_pkey PRIMARY KEY (id),
  CONSTRAINT shop_variant_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.shop_variants(id)
);
CREATE TABLE public.shop_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  title text NOT NULL,
  sku text UNIQUE,
  price_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  compare_at_price numeric,
  inventory_quantity integer DEFAULT 0,
  requires_shipping boolean DEFAULT false,
  weight_grams integer,
  entitlement_resource_type text,
  entitlement_resource_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shop_variants_pkey PRIMARY KEY (id),
  CONSTRAINT shop_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.shop_products(id)
);
CREATE TABLE public.streak_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  streak_type text NOT NULL,
  milestone_days integer NOT NULL,
  achieved_at timestamp with time zone DEFAULT now(),
  xp_awarded integer NOT NULL,
  CONSTRAINT streak_milestones_pkey PRIMARY KEY (id),
  CONSTRAINT streak_milestones_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_achievement_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  current_progress integer DEFAULT 0,
  target_progress integer NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  started_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_achievement_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievement_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_achievement_progress_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  unlocked_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.user_daily_activity (
  user_id uuid NOT NULL,
  activity_date date NOT NULL,
  workout_completed boolean DEFAULT false,
  meal_logged boolean DEFAULT false,
  weight_logged boolean DEFAULT false,
  goals_met boolean DEFAULT false,
  activity_score integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_daily_activity_pkey PRIMARY KEY (user_id, activity_date),
  CONSTRAINT user_daily_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_exercise_column_preferences (
  user_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  visible_columns ARRAY NOT NULL DEFAULT '{}'::text[] CHECK (array_length(visible_columns, 1) IS NULL OR array_length(visible_columns, 1) <= 4),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_exercise_column_preferences_pkey PRIMARY KEY (user_id, exercise_id),
  CONSTRAINT user_exercise_column_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_exercise_column_preferences_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);
CREATE TABLE public.user_habits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text CHECK (category = ANY (ARRAY['Health'::text, 'Productivity'::text, 'Mindfulness'::text, 'Social'::text, 'Custom'::text])),
  frequency text NOT NULL DEFAULT 'daily'::text CHECK (frequency = ANY (ARRAY['daily'::text, 'custom'::text])),
  schedule_days ARRAY,
  color_hex text,
  icon text,
  daily_goal_minutes integer,
  reminder_time time with time zone,
  why_text text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_habits_pkey PRIMARY KEY (id),
  CONSTRAINT user_habits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_health_profile (
  user_id uuid NOT NULL,
  height_cm numeric,
  activity_level text CHECK (activity_level = ANY (ARRAY['sedentary'::text, 'light'::text, 'moderate'::text, 'active'::text, 'athlete'::text])),
  allergies ARRAY,
  dietary_preferences ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  goals ARRAY,
  CONSTRAINT user_health_profile_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_health_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  streak_type text NOT NULL CHECK (streak_type = ANY (ARRAY['workout'::text, 'nutrition'::text, 'weight_tracking'::text, 'overall'::text])),
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  streak_start_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_streaks_pkey PRIMARY KEY (id),
  CONSTRAINT user_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_xp (
  user_id uuid NOT NULL,
  total_xp bigint NOT NULL DEFAULT 0,
  current_level integer NOT NULL DEFAULT 1,
  xp_in_current_level bigint NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_xp_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_xp_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_xp_limits (
  user_id uuid NOT NULL,
  limit_date date NOT NULL,
  activity_type text NOT NULL,
  xp_earned_today integer DEFAULT 0,
  activity_count_today integer DEFAULT 0,
  last_reset_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_xp_limits_pkey PRIMARY KEY (user_id, limit_date, activity_type),
  CONSTRAINT user_xp_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_xp_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  xp_amount integer NOT NULL,
  activity_type text NOT NULL,
  activity_reference_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_xp_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT user_xp_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.workout_program_adaptations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workout_program_id uuid NOT NULL,
  adapted_at timestamp with time zone DEFAULT now(),
  week_number integer NOT NULL,
  adaptation_type text CHECK (adaptation_type = ANY (ARRAY['intensity_increase'::text, 'intensity_decrease'::text, 'rest_added'::text, 'deload_week'::text, 'volume_increase'::text, 'volume_decrease'::text])),
  reason text,
  changes jsonb,
  ai_explanation text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_program_adaptations_pkey PRIMARY KEY (id),
  CONSTRAINT workout_program_adaptations_workout_program_id_fkey FOREIGN KEY (workout_program_id) REFERENCES public.workout_programs(id)
);
CREATE TABLE public.workout_program_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workout_program_id uuid NOT NULL,
  workout_program_day_id uuid NOT NULL,
  workout_session_id uuid,
  completed_at timestamp with time zone DEFAULT now(),
  actual_date date NOT NULL DEFAULT CURRENT_DATE,
  feeling_score integer CHECK (feeling_score >= 1 AND feeling_score <= 10),
  energy_before integer CHECK (energy_before >= 1 AND energy_before <= 10),
  energy_after integer CHECK (energy_after >= 1 AND energy_after <= 10),
  rpe_actual numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_program_completions_pkey PRIMARY KEY (id),
  CONSTRAINT workout_program_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT workout_program_completions_workout_program_id_fkey FOREIGN KEY (workout_program_id) REFERENCES public.workout_programs(id),
  CONSTRAINT workout_program_completions_workout_program_day_id_fkey FOREIGN KEY (workout_program_day_id) REFERENCES public.workout_program_days(id),
  CONSTRAINT workout_program_completions_workout_session_id_fkey FOREIGN KEY (workout_session_id) REFERENCES public.workout_sessions(id)
);
CREATE TABLE public.workout_program_day_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workout_program_day_id uuid NOT NULL,
  workout_template_id uuid NOT NULL,
  order_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_program_day_templates_pkey PRIMARY KEY (id),
  CONSTRAINT workout_program_day_templates_workout_program_day_id_fkey FOREIGN KEY (workout_program_day_id) REFERENCES public.workout_program_days(id),
  CONSTRAINT workout_program_day_templates_workout_template_id_fkey FOREIGN KEY (workout_template_id) REFERENCES public.workout_templates(id)
);
CREATE TABLE public.workout_program_days (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workout_program_id uuid NOT NULL,
  week_number integer NOT NULL,
  day_number integer NOT NULL,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  is_rest_day boolean DEFAULT false,
  day_label text,
  workout_type text CHECK (workout_type = ANY (ARRAY['strength'::text, 'cardio'::text, 'mobility'::text, 'rest'::text, 'active_recovery'::text])),
  focus_muscles jsonb,
  suggested_duration_min integer,
  suggested_intensity text CHECK (suggested_intensity = ANY (ARRAY['light'::text, 'moderate'::text, 'challenging'::text])),
  notes text,
  is_optional boolean DEFAULT false,
  rpe_target numeric,
  CONSTRAINT workout_program_days_pkey PRIMARY KEY (id),
  CONSTRAINT workout_program_days_workout_program_id_fkey FOREIGN KEY (workout_program_id) REFERENCES public.workout_programs(id)
);
CREATE TABLE public.workout_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  duration_weeks integer,
  difficulty text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  intention text CHECK (intention = ANY (ARRAY['feel_stronger'::text, 'build_energy'::text, 'consistency'::text, 'stress_reduction'::text, 'recovery'::text])),
  fitness_level text CHECK (fitness_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])),
  is_active boolean DEFAULT false,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  current_week integer DEFAULT 1,
  ai_generated boolean DEFAULT false,
  ai_prompt text,
  CONSTRAINT workout_programs_pkey PRIMARY KEY (id),
  CONSTRAINT workout_programs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.workout_session_exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workout_session_id uuid NOT NULL,
  exercise_id uuid,
  exercise_name text NOT NULL,
  order_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_session_exercises_pkey PRIMARY KEY (id),
  CONSTRAINT workout_session_exercises_session_fkey FOREIGN KEY (workout_session_id) REFERENCES public.workout_sessions(id),
  CONSTRAINT workout_session_exercises_exercise_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);
CREATE TABLE public.workout_session_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workout_session_exercise_id uuid NOT NULL,
  set_number integer NOT NULL,
  weight numeric,
  reps integer,
  duration_seconds integer,
  rest_seconds integer,
  rir integer CHECK (rir >= 0 AND rir <= 5),
  created_at timestamp with time zone DEFAULT now(),
  rpe numeric CHECK (rpe >= 1::numeric AND rpe <= 10::numeric),
  tempo text,
  distance_meters numeric,
  avg_heart_rate integer,
  difficulty_level text CHECK (difficulty_level = ANY (ARRAY['easy'::text, 'moderate'::text, 'hard'::text, 'max'::text])),
  side text CHECK (side = ANY (ARRAY['left'::text, 'right'::text, 'both'::text])),
  hold_time_seconds integer,
  pace_min_per_km numeric,
  feeling_score integer CHECK (feeling_score >= 1 AND feeling_score <= 10),
  CONSTRAINT workout_session_sets_pkey PRIMARY KEY (id),
  CONSTRAINT workout_session_sets_exercise_fkey FOREIGN KEY (workout_session_exercise_id) REFERENCES public.workout_session_exercises(id)
);
CREATE TABLE public.workout_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workout_template_id uuid,
  workout_program_id uuid,
  workout_program_day_id uuid,
  performed_at timestamp with time zone NOT NULL DEFAULT now(),
  duration_minutes integer,
  perceived_effort integer CHECK (perceived_effort >= 1 AND perceived_effort <= 10),
  notes text,
  source text DEFAULT 'manual'::text CHECK (source = ANY (ARRAY['manual'::text, 'program'::text, 'ai'::text, 'import'::text])),
  session_type text CHECK (session_type = ANY (ARRAY['strength'::text, 'cardio'::text, 'yoga'::text, 'hiit'::text, 'general'::text])),
  calories_burned integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  feeling_score integer CHECK (feeling_score >= 1 AND feeling_score <= 10),
  energy_before integer CHECK (energy_before >= 1 AND energy_before <= 10),
  energy_after integer CHECK (energy_after >= 1 AND energy_after <= 10),
  rpe_actual numeric,
  CONSTRAINT workout_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT workout_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT workout_sessions_template_fkey FOREIGN KEY (workout_template_id) REFERENCES public.workout_templates(id),
  CONSTRAINT workout_sessions_program_fkey FOREIGN KEY (workout_program_id) REFERENCES public.workout_programs(id),
  CONSTRAINT workout_sessions_program_day_fkey FOREIGN KEY (workout_program_day_id) REFERENCES public.workout_program_days(id)
);
CREATE TABLE public.workout_template_exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workout_template_id uuid NOT NULL,
  exercise_name text NOT NULL,
  order_index integer NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  exercise_id uuid,
  CONSTRAINT workout_template_exercises_pkey PRIMARY KEY (id),
  CONSTRAINT workout_template_exercises_workout_template_id_fkey FOREIGN KEY (workout_template_id) REFERENCES public.workout_templates(id),
  CONSTRAINT workout_template_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);
CREATE TABLE public.workout_template_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workout_template_exercise_id uuid NOT NULL,
  set_number integer NOT NULL,
  reps integer,
  duration_seconds integer,
  rest_seconds integer,
  created_at timestamp with time zone DEFAULT now(),
  tempo text,
  CONSTRAINT workout_template_sets_pkey PRIMARY KEY (id),
  CONSTRAINT workout_template_sets_workout_template_exercise_id_fkey FOREIGN KEY (workout_template_exercise_id) REFERENCES public.workout_template_exercises(id)
);
CREATE TABLE public.workout_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  estimated_duration_minutes integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  is_system_template boolean NOT NULL DEFAULT false,
  activity_type text CHECK (activity_type IS NULL OR (activity_type = ANY (ARRAY['bodybuilding'::text, 'strength'::text, 'yoga'::text, 'stretch'::text, 'rest'::text, 'calisthenics'::text, 'hybrid'::text, 'running'::text]))),
  activity_type_tags ARRAY,
  CONSTRAINT workout_templates_pkey PRIMARY KEY (id),
  CONSTRAINT workout_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.xp_activity_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  flag_type text NOT NULL CHECK (flag_type = ANY (ARRAY['rapid_fire'::text, 'pattern_abuse'::text, 'impossible_values'::text, 'daily_cap_hit'::text])),
  activity_type text NOT NULL,
  activity_reference_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  flagged_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'legitimate'::text, 'violation'::text, 'warning_issued'::text])),
  CONSTRAINT xp_activity_flags_pkey PRIMARY KEY (id),
  CONSTRAINT xp_activity_flags_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.xp_activity_limits (
  activity_type text NOT NULL,
  max_xp_per_day integer,
  max_activities_per_day integer,
  diminishing_return_start integer,
  diminishing_return_rate numeric DEFAULT 0.5,
  cooldown_minutes integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT xp_activity_limits_pkey PRIMARY KEY (activity_type)
);
CREATE TABLE public.xp_levels (
  level integer NOT NULL,
  xp_required bigint NOT NULL,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT xp_levels_pkey PRIMARY KEY (level)
);