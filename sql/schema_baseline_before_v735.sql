-- Schema only. For a NEW, EMPTY Supabase test project. No Auth users or journal data.
BEGIN;
CREATE TABLE public."trading_setup_catalog" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"name" text NOT NULL,
"description" text DEFAULT ''::text NOT NULL,
"image_path" text,
"active" boolean DEFAULT true NOT NULL,
"sort_order" integer DEFAULT 0 NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public."training_countermeasures" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"error_key" text NOT NULL,
"rule_text" text NOT NULL,
"activated_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public."training_goals_v7" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"goal" text NOT NULL,
"status" text DEFAULT 'active'::text NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
"practiced_at" timestamp with time zone);
CREATE TABLE public."trade_ideas_v733" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"session_id" uuid NOT NULL,
"setup_type" text NOT NULL,
"instrument" text NOT NULL,
"direction" text NOT NULL,
"thesis" text NOT NULL,
"trigger_condition" text NOT NULL,
"invalidation" text NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"status" text DEFAULT 'active'::text NOT NULL);
CREATE TABLE public."trade_attempts_v733" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"trade_id" uuid NOT NULL,
"idea_id" uuid,
"attempt_number" integer,
"classification" text NOT NULL,
"warning_answers" jsonb,
"created_at" timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public."stop_adjustments" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"trade_id" uuid NOT NULL,
"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
"adjustment_type" text NOT NULL,
"reason" text NOT NULL,
"notes" text,
"allocation_id" uuid,
"previous_stop_ticks" integer,
"new_stop_ticks" integer);
CREATE TABLE public."trading_sessions" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"session_date" date NOT NULL,
"status" text DEFAULT 'open'::text NOT NULL,
"emotional_state" text,
"urge_to_trade" boolean,
"htf_context" jsonb DEFAULT '{}'::jsonb NOT NULL,
"notes" text,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"closed_at" timestamp with time zone);
CREATE TABLE public."trade_ideas" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"session_id" uuid NOT NULL,
"setup_type" text NOT NULL,
"instrument" text NOT NULL,
"direction" text NOT NULL,
"thesis" text,
"status" text DEFAULT 'planned'::text NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public."trades" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"session_id" uuid NOT NULL,
"idea_id" uuid,
"setup_type" text NOT NULL,
"instrument" text NOT NULL,
"direction" text NOT NULL,
"entry_at" timestamp with time zone DEFAULT now() NOT NULL,
"exit_at" timestamp with time zone,
"initial_risk_usd" numeric(14,2),
"realized_pnl_usd" numeric(14,2),
"exit_reason" text,
"rule_deviation" boolean DEFAULT false NOT NULL,
"deviation_reason" text,
"entry_emotion" text,
"exit_emotion" text,
"execution_grade" text,
"observations" jsonb DEFAULT '{}'::jsonb NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public."trade_events" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"trade_id" uuid NOT NULL,
"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
"event_type" text NOT NULL,
"details" jsonb DEFAULT '{}'::jsonb NOT NULL);
CREATE TABLE public."screenshots" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"session_id" uuid,
"trade_id" uuid,
"timeframe_type" text NOT NULL,
"storage_path" text NOT NULL,
"caption" text,
"created_at" timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public."corrective_actions" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"title" text NOT NULL,
"if_then_rule" text NOT NULL,
"active" boolean DEFAULT true NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public."trade_errors" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"trade_id" uuid NOT NULL,
"error_type" text NOT NULL,
"cause" text,
"corrective_action_id" uuid,
"created_at" timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public."trade_reviews" ("trade_id" uuid NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"entry_quality" text,
"management_quality" text,
"best_practice" text,
"learning" text,
"reviewed_at" timestamp with time zone);
CREATE TABLE public."playbook_entries" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"trade_id" uuid NOT NULL,
"setup_type" text NOT NULL,
"quality" text NOT NULL,
"repeatable_behavior" text,
"created_at" timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public."trading_accounts" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"account_name" text NOT NULL,
"account_number" text,
"account_type" text DEFAULT 'other'::text NOT NULL,
"broker" text,
"default_instrument" text DEFAULT 'NQ'::text NOT NULL,
"default_quantity" numeric DEFAULT 1 NOT NULL,
"active" boolean DEFAULT true NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public."account_groups" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"group_name" text NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public."account_group_members" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"group_id" uuid NOT NULL,
"account_id" uuid NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public."account_fills" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"allocation_id" uuid NOT NULL,
"fill_type" text NOT NULL,
"quantity" numeric NOT NULL,
"price" numeric NOT NULL,
"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
"fee_usd" numeric DEFAULT 0 NOT NULL,
"source" text DEFAULT 'manual'::text NOT NULL,
"external_fill_id" text,
"notes" text,
"created_at" timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public."trade_account_allocations" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"trade_id" uuid NOT NULL,
"account_id" uuid NOT NULL,
"role" text DEFAULT 'follower'::text NOT NULL,
"instrument" text NOT NULL,
"planned_quantity" numeric NOT NULL,
"initial_risk_usd" numeric,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"initial_sl_points" numeric,
"calculated_risk_usd" numeric,
"risk_manually_overridden" boolean DEFAULT false NOT NULL);
CREATE TABLE public."account_trade_results" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"allocation_id" uuid NOT NULL,
"realized_pnl_usd" numeric,
"fees_usd" numeric,
"result_status" text DEFAULT 'pending'::text NOT NULL,
"notes" text,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
"tp_ticks" integer);
CREATE TABLE public."allocation_change_log" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,
"owner_id" uuid DEFAULT auth.uid() NOT NULL,
"allocation_id" uuid NOT NULL,
"event_type" text NOT NULL,
"old_values" jsonb,
"new_values" jsonb,
"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
"event_seq" bigint GENERATED ALWAYS AS IDENTITY NOT NULL);
ALTER TABLE public."account_trade_results" ADD CONSTRAINT "account_trade_results_pkey" PRIMARY KEY (id);
ALTER TABLE public."account_trade_results" ADD CONSTRAINT "account_trade_results_allocation_id_key" UNIQUE (allocation_id);
ALTER TABLE public."account_trade_results" ADD CONSTRAINT "account_trade_results_id_owner_id_key" UNIQUE (id, owner_id);
ALTER TABLE public."allocation_change_log" ADD CONSTRAINT "allocation_change_log_pkey" PRIMARY KEY (id);
ALTER TABLE public."allocation_change_log" ADD CONSTRAINT "allocation_change_log_id_owner_id_key" UNIQUE (id, owner_id);
ALTER TABLE public."trading_sessions" ADD CONSTRAINT "trading_sessions_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])));
ALTER TABLE public."trading_sessions" ADD CONSTRAINT "trading_sessions_pkey" PRIMARY KEY (id);
ALTER TABLE public."trading_sessions" ADD CONSTRAINT "trading_sessions_id_owner_id_key" UNIQUE (id, owner_id);
ALTER TABLE public."trade_ideas" ADD CONSTRAINT "trade_ideas_instrument_check" CHECK ((instrument = ANY (ARRAY['NQ'::text, 'MNQ'::text, 'ES'::text, 'MES'::text])));
ALTER TABLE public."trade_ideas" ADD CONSTRAINT "trade_ideas_direction_check" CHECK ((direction = ANY (ARRAY['long'::text, 'short'::text])));
ALTER TABLE public."trade_ideas" ADD CONSTRAINT "trade_ideas_status_check" CHECK ((status = ANY (ARRAY['planned'::text, 'executed'::text, 'discarded'::text])));
ALTER TABLE public."trade_ideas" ADD CONSTRAINT "trade_ideas_pkey" PRIMARY KEY (id);
ALTER TABLE public."trade_ideas" ADD CONSTRAINT "trade_ideas_id_owner_id_key" UNIQUE (id, owner_id);
ALTER TABLE public."trades" ADD CONSTRAINT "trades_instrument_check" CHECK ((instrument = ANY (ARRAY['NQ'::text, 'MNQ'::text, 'ES'::text, 'MES'::text])));
ALTER TABLE public."trades" ADD CONSTRAINT "trades_direction_check" CHECK ((direction = ANY (ARRAY['long'::text, 'short'::text])));
ALTER TABLE public."trades" ADD CONSTRAINT "trades_initial_risk_usd_check" CHECK ((initial_risk_usd > (0)::numeric));
ALTER TABLE public."trades" ADD CONSTRAINT "trades_execution_grade_check" CHECK ((execution_grade = ANY (ARRAY['A+'::text, 'A'::text, 'B'::text, 'C'::text, 'unrated'::text])));
ALTER TABLE public."trades" ADD CONSTRAINT "trades_check" CHECK (((exit_at IS NULL) OR (exit_at >= entry_at)));
ALTER TABLE public."trades" ADD CONSTRAINT "trades_check1" CHECK (((exit_at IS NULL) OR ((exit_reason IS NOT NULL) AND (realized_pnl_usd IS NOT NULL))));
ALTER TABLE public."trades" ADD CONSTRAINT "trades_pkey" PRIMARY KEY (id);
ALTER TABLE public."trades" ADD CONSTRAINT "trades_id_owner_id_key" UNIQUE (id, owner_id);
ALTER TABLE public."stop_adjustments" ADD CONSTRAINT "stop_adjustments_adjustment_type_check" CHECK ((adjustment_type = ANY (ARRAY['break_even'::text, 'reduce_risk'::text, 'lock_profit'::text, 'widen_stop'::text, 'other'::text])));
ALTER TABLE public."stop_adjustments" ADD CONSTRAINT "stop_adjustments_pkey" PRIMARY KEY (id);
ALTER TABLE public."trade_events" ADD CONSTRAINT "trade_events_pkey" PRIMARY KEY (id);
ALTER TABLE public."screenshots" ADD CONSTRAINT "screenshots_timeframe_type_check" CHECK ((timeframe_type = ANY (ARRAY['HTF'::text, 'LTF'::text])));
ALTER TABLE public."screenshots" ADD CONSTRAINT "screenshots_check" CHECK (((session_id IS NOT NULL) OR (trade_id IS NOT NULL)));
ALTER TABLE public."screenshots" ADD CONSTRAINT "screenshots_pkey" PRIMARY KEY (id);
ALTER TABLE public."screenshots" ADD CONSTRAINT "screenshots_owner_id_storage_path_key" UNIQUE (owner_id, storage_path);
ALTER TABLE public."corrective_actions" ADD CONSTRAINT "corrective_actions_pkey" PRIMARY KEY (id);
ALTER TABLE public."corrective_actions" ADD CONSTRAINT "corrective_actions_id_owner_id_key" UNIQUE (id, owner_id);
ALTER TABLE public."trade_errors" ADD CONSTRAINT "trade_errors_pkey" PRIMARY KEY (id);
ALTER TABLE public."trade_reviews" ADD CONSTRAINT "trade_reviews_pkey" PRIMARY KEY (trade_id);
ALTER TABLE public."playbook_entries" ADD CONSTRAINT "playbook_entries_quality_check" CHECK ((quality = ANY (ARRAY['A+'::text, 'A'::text, 'B'::text])));
ALTER TABLE public."playbook_entries" ADD CONSTRAINT "playbook_entries_pkey" PRIMARY KEY (id);
ALTER TABLE public."playbook_entries" ADD CONSTRAINT "playbook_entries_owner_id_trade_id_key" UNIQUE (owner_id, trade_id);
ALTER TABLE public."trading_accounts" ADD CONSTRAINT "trading_accounts_account_name_check" CHECK ((length(btrim(account_name)) > 0));
ALTER TABLE public."trading_accounts" ADD CONSTRAINT "trading_accounts_account_type_check" CHECK ((account_type = ANY (ARRAY['personal'::text, 'evaluation'::text, 'funded'::text, 'demo'::text, 'other'::text])));
ALTER TABLE public."trading_accounts" ADD CONSTRAINT "trading_accounts_default_quantity_check" CHECK ((default_quantity > (0)::numeric));
ALTER TABLE public."trading_accounts" ADD CONSTRAINT "trading_accounts_pkey" PRIMARY KEY (id);
ALTER TABLE public."trading_accounts" ADD CONSTRAINT "trading_accounts_id_owner_id_key" UNIQUE (id, owner_id);
ALTER TABLE public."account_groups" ADD CONSTRAINT "account_groups_group_name_check" CHECK ((length(btrim(group_name)) > 0));
ALTER TABLE public."account_groups" ADD CONSTRAINT "account_groups_pkey" PRIMARY KEY (id);
ALTER TABLE public."account_groups" ADD CONSTRAINT "account_groups_id_owner_id_key" UNIQUE (id, owner_id);
ALTER TABLE public."account_groups" ADD CONSTRAINT "account_groups_owner_id_group_name_key" UNIQUE (owner_id, group_name);
ALTER TABLE public."account_group_members" ADD CONSTRAINT "account_group_members_pkey" PRIMARY KEY (id);
ALTER TABLE public."account_group_members" ADD CONSTRAINT "account_group_members_group_id_account_id_key" UNIQUE (group_id, account_id);
ALTER TABLE public."account_group_members" ADD CONSTRAINT "account_group_members_id_owner_id_key" UNIQUE (id, owner_id);
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "trade_account_allocations_role_check" CHECK ((role = ANY (ARRAY['leader'::text, 'follower'::text, 'manual'::text])));
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "trade_account_allocations_instrument_check" CHECK ((length(btrim(instrument)) > 0));
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "trade_account_allocations_planned_quantity_check" CHECK ((planned_quantity > (0)::numeric));
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "trade_account_allocations_initial_risk_usd_check" CHECK ((initial_risk_usd > (0)::numeric));
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "trade_account_allocations_pkey" PRIMARY KEY (id);
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "trade_account_allocations_trade_id_account_id_key" UNIQUE (trade_id, account_id);
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "trade_account_allocations_id_owner_id_key" UNIQUE (id, owner_id);
ALTER TABLE public."account_fills" ADD CONSTRAINT "account_fills_fill_type_check" CHECK ((fill_type = ANY (ARRAY['entry'::text, 'exit'::text])));
ALTER TABLE public."account_fills" ADD CONSTRAINT "account_fills_quantity_check" CHECK ((quantity > (0)::numeric));
ALTER TABLE public."account_fills" ADD CONSTRAINT "account_fills_price_check" CHECK ((price > (0)::numeric));
ALTER TABLE public."account_fills" ADD CONSTRAINT "account_fills_fee_usd_check" CHECK ((fee_usd >= (0)::numeric));
ALTER TABLE public."account_fills" ADD CONSTRAINT "account_fills_source_check" CHECK ((source = ANY (ARRAY['manual'::text, 'import'::text])));
ALTER TABLE public."account_fills" ADD CONSTRAINT "account_fills_pkey" PRIMARY KEY (id);
ALTER TABLE public."account_fills" ADD CONSTRAINT "account_fills_id_owner_id_key" UNIQUE (id, owner_id);
ALTER TABLE public."account_trade_results" ADD CONSTRAINT "account_trade_results_fees_usd_check" CHECK ((fees_usd >= (0)::numeric));
ALTER TABLE public."account_trade_results" ADD CONSTRAINT "account_trade_results_result_status_check" CHECK ((result_status = ANY (ARRAY['pending'::text, 'partial'::text, 'final'::text])));
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "taa_initial_sl_points_positive" CHECK (((initial_sl_points IS NULL) OR (initial_sl_points > (0)::numeric)));
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "taa_calculated_risk_positive" CHECK (((calculated_risk_usd IS NULL) OR (calculated_risk_usd > (0)::numeric)));
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "taa_risk_complete" CHECK ((((initial_sl_points IS NULL) AND (calculated_risk_usd IS NULL) AND (initial_risk_usd IS NULL) AND (risk_manually_overridden = false)) OR ((initial_sl_points IS NOT NULL) AND (calculated_risk_usd IS NOT NULL) AND (initial_risk_usd IS NOT NULL))));
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "taa_risk_calculation_matches" CHECK (((initial_sl_points IS NULL) OR (calculated_risk_usd = round(((initial_sl_points * planned_quantity) * (
CASE instrument
    WHEN 'NQ'::text THEN 20
    WHEN 'MNQ'::text THEN 2
    WHEN 'ES'::text THEN 50
    WHEN 'MES'::text THEN 5
    ELSE NULL::integer
END)::numeric), 2))));
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "taa_risk_override_consistent" CHECK ((risk_manually_overridden OR (initial_risk_usd IS NULL) OR (initial_risk_usd = calculated_risk_usd)));
ALTER TABLE public."stop_adjustments" ADD CONSTRAINT "stop_adjustments_complete_tick_record" CHECK ((((allocation_id IS NULL) AND (previous_stop_ticks IS NULL) AND (new_stop_ticks IS NULL)) OR ((allocation_id IS NOT NULL) AND (previous_stop_ticks IS NOT NULL) AND (new_stop_ticks IS NOT NULL))));
ALTER TABLE public."stop_adjustments" ADD CONSTRAINT "stop_adjustments_stop_must_change" CHECK (((previous_stop_ticks IS NULL) OR (previous_stop_ticks <> new_stop_ticks)));
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "taa_id_trade_owner_unique" UNIQUE (id, trade_id, owner_id);
ALTER TABLE public."account_trade_results" ADD CONSTRAINT "atr_tp_ticks_positive" CHECK (((tp_ticks IS NULL) OR (tp_ticks > 0)));
ALTER TABLE public."trading_setup_catalog" ADD CONSTRAINT "trading_setup_catalog_name_check" CHECK (((char_length(TRIM(BOTH FROM name)) >= 1) AND (char_length(TRIM(BOTH FROM name)) <= 80)));
ALTER TABLE public."trading_setup_catalog" ADD CONSTRAINT "trading_setup_catalog_pkey" PRIMARY KEY (id);
ALTER TABLE public."training_countermeasures" ADD CONSTRAINT "training_countermeasures_rule_text_check" CHECK (((char_length(TRIM(BOTH FROM rule_text)) >= 5) AND (char_length(TRIM(BOTH FROM rule_text)) <= 1000)));
ALTER TABLE public."training_countermeasures" ADD CONSTRAINT "training_countermeasures_pkey" PRIMARY KEY (id);
ALTER TABLE public."training_countermeasures" ADD CONSTRAINT "training_countermeasures_owner_id_error_key_key" UNIQUE (owner_id, error_key);
ALTER TABLE public."training_goals_v7" ADD CONSTRAINT "training_goals_v7_goal_check" CHECK (((char_length(btrim(goal)) >= 10) AND (char_length(btrim(goal)) <= 500)));
ALTER TABLE public."training_goals_v7" ADD CONSTRAINT "training_goals_v7_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'practiced'::text])));
ALTER TABLE public."training_goals_v7" ADD CONSTRAINT "training_goals_v7_pkey" PRIMARY KEY (id);
ALTER TABLE public."trade_ideas_v733" ADD CONSTRAINT "trade_ideas_v733_instrument_check" CHECK ((instrument = ANY (ARRAY['NQ'::text, 'MNQ'::text, 'ES'::text, 'MES'::text])));
ALTER TABLE public."trade_ideas_v733" ADD CONSTRAINT "trade_ideas_v733_direction_check" CHECK ((direction = ANY (ARRAY['long'::text, 'short'::text])));
ALTER TABLE public."trade_ideas_v733" ADD CONSTRAINT "trade_ideas_v733_thesis_check" CHECK ((length(TRIM(BOTH FROM thesis)) > 0));
ALTER TABLE public."trade_ideas_v733" ADD CONSTRAINT "trade_ideas_v733_trigger_condition_check" CHECK ((length(TRIM(BOTH FROM trigger_condition)) > 0));
ALTER TABLE public."trade_ideas_v733" ADD CONSTRAINT "trade_ideas_v733_invalidation_check" CHECK ((length(TRIM(BOTH FROM invalidation)) > 0));
ALTER TABLE public."trade_ideas_v733" ADD CONSTRAINT "trade_ideas_v733_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'invalidated'::text, 'completed'::text])));
ALTER TABLE public."trade_ideas_v733" ADD CONSTRAINT "trade_ideas_v733_pkey" PRIMARY KEY (id);
ALTER TABLE public."trade_attempts_v733" ADD CONSTRAINT "trade_attempts_v733_attempt_number_check" CHECK (((attempt_number IS NULL) OR (attempt_number > 0)));
ALTER TABLE public."trade_attempts_v733" ADD CONSTRAINT "trade_attempts_v733_classification_check" CHECK ((classification = ANY (ARRAY['planned'::text, 'spontaneous'::text])));
ALTER TABLE public."trade_attempts_v733" ADD CONSTRAINT "trade_attempts_v733_check" CHECK ((((classification = 'planned'::text) AND (idea_id IS NOT NULL) AND (attempt_number IS NOT NULL)) OR ((classification = 'spontaneous'::text) AND (idea_id IS NULL) AND (attempt_number IS NULL))));
ALTER TABLE public."trade_attempts_v733" ADD CONSTRAINT "trade_attempts_v733_check1" CHECK (((attempt_number IS NULL) OR (attempt_number <= 3) OR ((jsonb_typeof(warning_answers) = 'object'::text) AND (warning_answers ?& ARRAY['thesis'::text, 'trigger'::text, 'risk'::text, 'motivation'::text]))));
ALTER TABLE public."trade_attempts_v733" ADD CONSTRAINT "trade_attempts_v733_pkey" PRIMARY KEY (id);
ALTER TABLE public."trade_attempts_v733" ADD CONSTRAINT "trade_attempts_v733_trade_id_key" UNIQUE (trade_id);
ALTER TABLE public."trade_events" ADD CONSTRAINT "trade_events_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."trade_events" ADD CONSTRAINT "trade_events_trade_id_owner_id_fkey" FOREIGN KEY (trade_id, owner_id) REFERENCES trades(id, owner_id) ON DELETE CASCADE;
ALTER TABLE public."account_trade_results" ADD CONSTRAINT "account_trade_results_allocation_id_owner_id_fkey" FOREIGN KEY (allocation_id, owner_id) REFERENCES trade_account_allocations(id, owner_id) ON DELETE CASCADE;
ALTER TABLE public."trading_sessions" ADD CONSTRAINT "trading_sessions_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."trade_ideas" ADD CONSTRAINT "trade_ideas_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."trade_ideas" ADD CONSTRAINT "trade_ideas_session_id_owner_id_fkey" FOREIGN KEY (session_id, owner_id) REFERENCES trading_sessions(id, owner_id) ON DELETE CASCADE;
ALTER TABLE public."trades" ADD CONSTRAINT "trades_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."trades" ADD CONSTRAINT "trades_session_id_owner_id_fkey" FOREIGN KEY (session_id, owner_id) REFERENCES trading_sessions(id, owner_id) ON DELETE CASCADE;
ALTER TABLE public."trades" ADD CONSTRAINT "trades_idea_id_owner_id_fkey" FOREIGN KEY (idea_id, owner_id) REFERENCES trade_ideas(id, owner_id) ON DELETE SET NULL (idea_id);
ALTER TABLE public."stop_adjustments" ADD CONSTRAINT "stop_adjustments_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."stop_adjustments" ADD CONSTRAINT "stop_adjustments_trade_id_owner_id_fkey" FOREIGN KEY (trade_id, owner_id) REFERENCES trades(id, owner_id) ON DELETE CASCADE;
ALTER TABLE public."screenshots" ADD CONSTRAINT "screenshots_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."screenshots" ADD CONSTRAINT "screenshots_session_id_owner_id_fkey" FOREIGN KEY (session_id, owner_id) REFERENCES trading_sessions(id, owner_id) ON DELETE CASCADE;
ALTER TABLE public."screenshots" ADD CONSTRAINT "screenshots_trade_id_owner_id_fkey" FOREIGN KEY (trade_id, owner_id) REFERENCES trades(id, owner_id) ON DELETE CASCADE;
ALTER TABLE public."corrective_actions" ADD CONSTRAINT "corrective_actions_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."trade_errors" ADD CONSTRAINT "trade_errors_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."trade_errors" ADD CONSTRAINT "trade_errors_trade_id_owner_id_fkey" FOREIGN KEY (trade_id, owner_id) REFERENCES trades(id, owner_id) ON DELETE CASCADE;
ALTER TABLE public."trade_errors" ADD CONSTRAINT "trade_errors_corrective_action_id_owner_id_fkey" FOREIGN KEY (corrective_action_id, owner_id) REFERENCES corrective_actions(id, owner_id) ON DELETE SET NULL (corrective_action_id);
ALTER TABLE public."trade_reviews" ADD CONSTRAINT "trade_reviews_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."trade_reviews" ADD CONSTRAINT "trade_reviews_trade_id_owner_id_fkey" FOREIGN KEY (trade_id, owner_id) REFERENCES trades(id, owner_id) ON DELETE CASCADE;
ALTER TABLE public."playbook_entries" ADD CONSTRAINT "playbook_entries_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."playbook_entries" ADD CONSTRAINT "playbook_entries_trade_id_owner_id_fkey" FOREIGN KEY (trade_id, owner_id) REFERENCES trades(id, owner_id) ON DELETE CASCADE;
ALTER TABLE public."account_group_members" ADD CONSTRAINT "account_group_members_group_id_owner_id_fkey" FOREIGN KEY (group_id, owner_id) REFERENCES account_groups(id, owner_id) ON DELETE CASCADE;
ALTER TABLE public."account_group_members" ADD CONSTRAINT "account_group_members_account_id_owner_id_fkey" FOREIGN KEY (account_id, owner_id) REFERENCES trading_accounts(id, owner_id) ON DELETE CASCADE;
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "trade_account_allocations_trade_id_owner_id_fkey" FOREIGN KEY (trade_id, owner_id) REFERENCES trades(id, owner_id) ON DELETE CASCADE;
ALTER TABLE public."trade_account_allocations" ADD CONSTRAINT "trade_account_allocations_account_id_owner_id_fkey" FOREIGN KEY (account_id, owner_id) REFERENCES trading_accounts(id, owner_id);
ALTER TABLE public."account_fills" ADD CONSTRAINT "account_fills_allocation_id_owner_id_fkey" FOREIGN KEY (allocation_id, owner_id) REFERENCES trade_account_allocations(id, owner_id) ON DELETE CASCADE;
ALTER TABLE public."stop_adjustments" ADD CONSTRAINT "stop_adjustments_allocation_owner_fkey" FOREIGN KEY (allocation_id, owner_id) REFERENCES trade_account_allocations(id, owner_id);
ALTER TABLE public."stop_adjustments" ADD CONSTRAINT "stop_adjustments_allocation_trade_owner_fkey" FOREIGN KEY (allocation_id, trade_id, owner_id) REFERENCES trade_account_allocations(id, trade_id, owner_id);
ALTER TABLE public."trading_setup_catalog" ADD CONSTRAINT "trading_setup_catalog_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."training_countermeasures" ADD CONSTRAINT "training_countermeasures_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."training_goals_v7" ADD CONSTRAINT "training_goals_v7_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."trade_ideas_v733" ADD CONSTRAINT "trade_ideas_v733_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id);
ALTER TABLE public."trade_ideas_v733" ADD CONSTRAINT "trade_ideas_v733_session_id_fkey" FOREIGN KEY (session_id) REFERENCES trading_sessions(id);
ALTER TABLE public."trade_attempts_v733" ADD CONSTRAINT "trade_attempts_v733_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id);
ALTER TABLE public."trade_attempts_v733" ADD CONSTRAINT "trade_attempts_v733_trade_id_fkey" FOREIGN KEY (trade_id) REFERENCES trades(id);
ALTER TABLE public."trade_attempts_v733" ADD CONSTRAINT "trade_attempts_v733_idea_id_fkey" FOREIGN KEY (idea_id) REFERENCES trade_ideas_v733(id);
CREATE OR REPLACE FUNCTION public.log_allocation_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.allocation_change_log (
      owner_id, allocation_id, event_type,
      old_values, new_values
    )
    VALUES (
      NEW.owner_id, NEW.id, 'created',
      NULL, to_jsonb(NEW)
    );

    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) THEN
      INSERT INTO public.allocation_change_log (
        owner_id, allocation_id, event_type,
        old_values, new_values
      )
      VALUES (
        OLD.owner_id, OLD.id, 'updated',
        to_jsonb(OLD), to_jsonb(NEW)
      );
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.allocation_change_log (
      owner_id, allocation_id, event_type,
      old_values, new_values
    )
    VALUES (
      OLD.owner_id, OLD.id, 'deleted',
      to_jsonb(OLD), NULL
    );

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$function$

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        SELECT c.relname INTO tbl FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
        EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$

CREATE OR REPLACE FUNCTION public.prevent_allocation_owner_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION
      'Changing allocation owner_id is not permitted';
  END IF;

  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.create_trade_with_allocations(p_session_id uuid, p_setup_type text, p_instrument text, p_direction text, p_allocations jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    v_owner uuid;
    v_trade_id uuid;
    v_item jsonb;
    v_account_id uuid;
    v_role text;
    v_instrument text;
    v_quantity numeric;
    v_leaders integer := 0;
    v_seen uuid[] := ARRAY[]::uuid[];
BEGIN
    v_owner := (SELECT auth.uid());

    IF v_owner IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.trading_sessions
        WHERE id = p_session_id
          AND owner_id = v_owner
          AND status = 'open'
    ) THEN
        RAISE EXCEPTION 'No accessible open session';
    END IF;

    IF p_setup_type IS NULL
       OR btrim(p_setup_type) = ''
       OR p_instrument NOT IN ('NQ','MNQ','ES','MES')
       OR p_direction NOT IN ('long','short')
       OR p_instrument IS NULL
       OR p_direction IS NULL
    THEN
        RAISE EXCEPTION 'Invalid trade parameters';
    END IF;

    IF p_allocations IS NULL
       OR jsonb_typeof(p_allocations) <> 'array'
       OR jsonb_array_length(p_allocations) = 0
    THEN
        RAISE EXCEPTION 'At least one allocation required';
    END IF;

    -- Alle Kontozuordnungen vorab prüfen
    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_allocations)
    LOOP
        IF jsonb_typeof(v_item) <> 'object' THEN
            RAISE EXCEPTION 'Invalid allocation object';
        END IF;

        v_account_id := (v_item->>'account_id')::uuid;
        v_role := v_item->>'role';
        v_instrument := v_item->>'instrument';
        v_quantity := (v_item->>'planned_quantity')::numeric;

        IF v_account_id IS NULL
           OR v_role IS NULL
           OR v_role NOT IN ('leader','follower','manual')
           OR v_instrument IS NULL
           OR v_instrument NOT IN ('NQ','MNQ','ES','MES')
           OR v_quantity IS NULL
           OR v_quantity <= 0
        THEN
            RAISE EXCEPTION 'Invalid allocation parameters';
        END IF;

        IF v_account_id = ANY(v_seen) THEN
            RAISE EXCEPTION 'Duplicate account allocation';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM public.trading_accounts
            WHERE id = v_account_id
              AND owner_id = v_owner
              AND active = true
        ) THEN
            RAISE EXCEPTION 'Account unavailable or inactive';
        END IF;

        v_seen := array_append(v_seen, v_account_id);

        IF v_role = 'leader' THEN
            v_leaders := v_leaders + 1;
        END IF;
    END LOOP;

    IF v_leaders <> 1 THEN
        RAISE EXCEPTION 'Exactly one leader required';
    END IF;

    -- Eine Trading-Entscheidung anlegen
    INSERT INTO public.trades (
        owner_id,
        session_id,
        setup_type,
        instrument,
        direction,
        entry_at
    )
    VALUES (
        v_owner,
        p_session_id,
        p_setup_type,
        p_instrument,
        p_direction,
        now()
    )
    RETURNING id INTO v_trade_id;

    -- Alle zugehörigen Konten speichern
    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_allocations)
    LOOP
        INSERT INTO public.trade_account_allocations (
            owner_id,
            trade_id,
            account_id,
            role,
            instrument,
            planned_quantity
        )
        VALUES (
            v_owner,
            v_trade_id,
            (v_item->>'account_id')::uuid,
            v_item->>'role',
            v_item->>'instrument',
            (v_item->>'planned_quantity')::numeric
        );
    END LOOP;

    RETURN v_trade_id;
END;
$function$

CREATE OR REPLACE FUNCTION public.record_stop_adjustment(p_allocation_id uuid, p_expected_previous_ticks integer, p_new_stop_ticks integer, p_reason text, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_user uuid := auth.uid();
 v_trade_id uuid;
 v_initial_ticks integer;
 v_previous integer;
 v_id uuid;
 v_adjustment_type text;
 v_direction text;
 v_closed_at timestamptz;
BEGIN
 IF v_user IS NULL OR auth.role() <> 'authenticated' THEN
   RAISE EXCEPTION 'Authentication required';
 END IF;
 IF p_allocation_id IS NULL OR p_expected_previous_ticks IS NULL OR p_new_stop_ticks IS NULL THEN
   RAISE EXCEPTION 'Allocation and stop values are required';
 END IF;
 IF p_reason IS NULL OR p_reason NOT IN
  ('market_structure','momentum_loss','absorption','profit_protection','fear_of_giving_back','poor_entry','other') THEN
   RAISE EXCEPTION 'Invalid reason';
 END IF;
 SELECT a.trade_id, (a.initial_sl_points * 4)::integer, t.direction, t.exit_at
 INTO v_trade_id,v_initial_ticks,v_direction,v_closed_at
 FROM public.trade_account_allocations a
 JOIN public.trades t ON t.id=a.trade_id AND t.owner_id=a.owner_id
 WHERE a.id=p_allocation_id AND a.owner_id=v_user
 FOR UPDATE OF a;
 IF NOT FOUND THEN RAISE EXCEPTION 'Allocation not found'; END IF;
 IF v_closed_at IS NOT NULL THEN RAISE EXCEPTION 'Trade is already closed'; END IF;
 IF v_initial_ticks IS NULL OR v_initial_ticks <= 0 THEN
   RAISE EXCEPTION 'Initial stop must be recorded first';
 END IF;
 SELECT sa.new_stop_ticks INTO v_previous
 FROM public.stop_adjustments sa
 WHERE sa.allocation_id=p_allocation_id AND sa.owner_id=v_user
 ORDER BY sa.changed_at DESC,sa.id DESC
 LIMIT 1;
 v_previous := coalesce(v_previous,-v_initial_ticks);
 IF p_expected_previous_ticks <> v_previous THEN
   RAISE EXCEPTION 'Stop changed since last refresh. Expected %, current %',p_expected_previous_ticks,v_previous;
 END IF;
 IF p_new_stop_ticks = v_previous THEN
   RAISE EXCEPTION 'Stop has not changed';
 END IF;
 v_adjustment_type := CASE
  WHEN p_new_stop_ticks=0 THEN 'break_even'
  WHEN p_new_stop_ticks>0 THEN 'lock_profit'
  WHEN p_new_stop_ticks>v_previous THEN 'reduce_risk'
  WHEN p_new_stop_ticks<v_previous THEN 'widen_stop'
  ELSE 'other' END;
 INSERT INTO public.stop_adjustments(
   owner_id,trade_id,allocation_id,changed_at,adjustment_type,reason,notes,
   previous_stop_ticks,new_stop_ticks
 ) VALUES (
   v_user,v_trade_id,p_allocation_id,clock_timestamp(),v_adjustment_type,p_reason,
   nullif(btrim(p_notes),''),v_previous,p_new_stop_ticks
 ) RETURNING id INTO v_id;
 RETURN v_id;
END;
$function$

CREATE OR REPLACE FUNCTION public.close_trade_with_account_results(p_trade_id uuid, p_exit_reason text, p_results jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_uid uuid:=auth.uid();v_trade public.trades%ROWTYPE;v_alloc public.trade_account_allocations%ROWTYPE;
v_item jsonb;v_expected integer;v_pnl numeric;v_fees numeric;v_total numeric:=0;v_risk numeric:=0;
v_tp integer;v_ids uuid[]:=ARRAY[]::uuid[];v_id uuid;v_exit timestamptz;
BEGIN
IF v_uid IS NULL OR auth.role()<>'authenticated' THEN RAISE EXCEPTION 'Authentication required';END IF;
IF p_exit_reason IS NULL OR p_exit_reason NOT IN ('TP','SL','BE','extended_tp','daily_target','manual','other') THEN RAISE EXCEPTION 'Invalid exit reason';END IF;
IF p_results IS NULL OR jsonb_typeof(p_results)<>'array' THEN RAISE EXCEPTION 'Results must be an array';END IF;
SELECT * INTO v_trade FROM public.trades WHERE id=p_trade_id AND owner_id=v_uid FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Trade not found';END IF;
IF v_trade.exit_at IS NOT NULL THEN RAISE EXCEPTION 'Trade already closed';END IF;
SELECT count(*) INTO v_expected FROM public.trade_account_allocations WHERE trade_id=p_trade_id AND owner_id=v_uid;
IF v_expected=0 OR jsonb_array_length(p_results)<>v_expected THEN RAISE EXCEPTION 'One result per account required';END IF;
FOR v_item IN SELECT value FROM jsonb_array_elements(p_results) LOOP
 IF jsonb_typeof(v_item)<>'object' OR NOT (v_item?'allocation_id' AND v_item?'realized_pnl_usd')
 OR jsonb_typeof(v_item->'allocation_id')<>'string' OR jsonb_typeof(v_item->'realized_pnl_usd')<>'number'
 THEN RAISE EXCEPTION 'Invalid account result';END IF;
 BEGIN
 v_id:=(v_item->>'allocation_id')::uuid;v_pnl:=(v_item->>'realized_pnl_usd')::numeric;
 v_fees:=CASE WHEN v_item?'fees_usd' AND v_item->'fees_usd'<>'null'::jsonb THEN (v_item->>'fees_usd')::numeric ELSE 0 END;
 v_tp:=CASE WHEN v_item?'tp_ticks' AND v_item->'tp_ticks'<>'null'::jsonb THEN (v_item->>'tp_ticks')::integer ELSE NULL END;
 EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN RAISE EXCEPTION 'Invalid numeric value, TP ticks or allocation ID';END;
 IF v_id=ANY(v_ids) THEN RAISE EXCEPTION 'Duplicate account allocation';END IF;
 IF v_fees IS NULL OR v_fees<0 OR (v_tp IS NOT NULL AND v_tp<=0) THEN RAISE EXCEPTION 'Invalid fees or TP ticks';END IF;
 SELECT * INTO v_alloc FROM public.trade_account_allocations WHERE id=v_id AND trade_id=p_trade_id AND owner_id=v_uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Allocation does not belong to trade';END IF;
 IF v_alloc.initial_risk_usd IS NULL OR v_alloc.initial_risk_usd<=0 THEN RAISE EXCEPTION 'Initial risk missing for allocation %',v_id;END IF;
 IF EXISTS(SELECT 1 FROM public.account_trade_results WHERE allocation_id=v_id) THEN RAISE EXCEPTION 'Account result already exists';END IF;
 INSERT INTO public.account_trade_results(owner_id,allocation_id,realized_pnl_usd,fees_usd,tp_ticks,result_status)
 VALUES(v_uid,v_id,v_pnl,v_fees,v_tp,'final');
 v_ids:=array_append(v_ids,v_id);v_total:=v_total+v_pnl;v_risk:=v_risk+v_alloc.initial_risk_usd;
END LOOP;
v_exit:=clock_timestamp();
UPDATE public.trades SET exit_at=greatest(v_exit,v_trade.entry_at),exit_reason=p_exit_reason,
realized_pnl_usd=v_total,initial_risk_usd=v_risk,updated_at=v_exit WHERE id=p_trade_id AND owner_id=v_uid;
RETURN jsonb_build_object('trade_id',p_trade_id,'exit_at',greatest(v_exit,v_trade.entry_at),
'total_pnl_usd',v_total,'total_initial_risk_usd',v_risk,'r_multiple',round(v_total/v_risk,3),'account_count',v_expected);
END $function$

CREATE OR REPLACE FUNCTION public.close_trade_with_account_results_v7(p_trade_id uuid, p_exit_reason text, p_results jsonb, p_exit_emotion text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_uid uuid:=auth.uid();v_trade public.trades%ROWTYPE;v_alloc public.trade_account_allocations%ROWTYPE;
v_item jsonb;v_expected integer;v_pnl numeric;v_fees numeric;v_total numeric:=0;v_risk numeric:=0;
v_tp integer;v_ids uuid[]:=ARRAY[]::uuid[];v_id uuid;v_exit timestamptz;
BEGIN
IF v_uid IS NULL OR auth.role()<>'authenticated' THEN RAISE EXCEPTION 'Authentication required';END IF;
IF p_exit_emotion IS NULL OR p_exit_emotion NOT IN ('disciplined','fear','greed','frustration','relief','uncertainty','stress') THEN RAISE EXCEPTION 'Exit emotion required'; END IF;
IF p_exit_reason IS NULL OR p_exit_reason NOT IN ('TP','SL','BE','extended_tp','daily_target','manual','other') THEN RAISE EXCEPTION 'Invalid exit reason';END IF;
IF p_results IS NULL OR jsonb_typeof(p_results)<>'array' THEN RAISE EXCEPTION 'Results must be an array';END IF;
SELECT * INTO v_trade FROM public.trades WHERE id=p_trade_id AND owner_id=v_uid FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Trade not found';END IF;
IF v_trade.exit_at IS NOT NULL THEN RAISE EXCEPTION 'Trade already closed';END IF;
SELECT count(*) INTO v_expected FROM public.trade_account_allocations WHERE trade_id=p_trade_id AND owner_id=v_uid;
IF v_expected=0 OR jsonb_array_length(p_results)<>v_expected THEN RAISE EXCEPTION 'One result per account required';END IF;
FOR v_item IN SELECT value FROM jsonb_array_elements(p_results) LOOP
 IF jsonb_typeof(v_item)<>'object' OR NOT (v_item?'allocation_id' AND v_item?'realized_pnl_usd')
 OR jsonb_typeof(v_item->'allocation_id')<>'string' OR jsonb_typeof(v_item->'realized_pnl_usd')<>'number'
 THEN RAISE EXCEPTION 'Invalid account result';END IF;
 BEGIN
 v_id:=(v_item->>'allocation_id')::uuid;v_pnl:=(v_item->>'realized_pnl_usd')::numeric;
 v_fees:=CASE WHEN v_item?'fees_usd' AND v_item->'fees_usd'<>'null'::jsonb THEN (v_item->>'fees_usd')::numeric ELSE 0 END;
 v_tp:=CASE WHEN v_item?'tp_ticks' AND v_item->'tp_ticks'<>'null'::jsonb THEN (v_item->>'tp_ticks')::integer ELSE NULL END;
 EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN RAISE EXCEPTION 'Invalid numeric value, TP ticks or allocation ID';END;
 IF v_id=ANY(v_ids) THEN RAISE EXCEPTION 'Duplicate account allocation';END IF;
 IF v_fees IS NULL OR v_fees<0 OR (v_tp IS NOT NULL AND v_tp<=0) THEN RAISE EXCEPTION 'Invalid fees or TP ticks';END IF;
 SELECT * INTO v_alloc FROM public.trade_account_allocations WHERE id=v_id AND trade_id=p_trade_id AND owner_id=v_uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Allocation does not belong to trade';END IF;
 IF v_alloc.initial_risk_usd IS NULL OR v_alloc.initial_risk_usd<=0 THEN RAISE EXCEPTION 'Initial risk missing for allocation %',v_id;END IF;
 IF EXISTS(SELECT 1 FROM public.account_trade_results WHERE allocation_id=v_id) THEN RAISE EXCEPTION 'Account result already exists';END IF;
 INSERT INTO public.account_trade_results(owner_id,allocation_id,realized_pnl_usd,fees_usd,tp_ticks,result_status)
 VALUES(v_uid,v_id,v_pnl,v_fees,v_tp,'final');
 v_ids:=array_append(v_ids,v_id);v_total:=v_total+v_pnl;v_risk:=v_risk+v_alloc.initial_risk_usd;
END LOOP;
v_exit:=clock_timestamp();
UPDATE public.trades SET exit_at=greatest(v_exit,v_trade.entry_at),exit_reason=p_exit_reason,
realized_pnl_usd=v_total,initial_risk_usd=v_risk,exit_emotion=p_exit_emotion,observations=coalesce(v_trade.observations,'{}'::jsonb)||jsonb_build_object('exit_emotion',p_exit_emotion),updated_at=v_exit WHERE id=p_trade_id AND owner_id=v_uid;
RETURN jsonb_build_object('trade_id',p_trade_id,'exit_at',greatest(v_exit,v_trade.entry_at),
'total_pnl_usd',v_total,'total_initial_risk_usd',v_risk,'r_multiple',round(v_total/v_risk,3),'account_count',v_expected);
END $function$

CREATE OR REPLACE FUNCTION public.create_trade_with_allocations_v7(p_session_id uuid, p_setup_type text, p_instrument text, p_direction text, p_allocations jsonb, p_entry_emotion text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    v_owner uuid;
    v_trade_id uuid;
    v_item jsonb;
    v_account_id uuid;
    v_role text;
    v_instrument text;
    v_quantity numeric;
    v_leaders integer := 0;
    v_seen uuid[] := ARRAY[]::uuid[];
BEGIN
    IF p_entry_emotion IS NULL OR p_entry_emotion NOT IN ('plan','fomo','revenge','impulsive','unreported') THEN RAISE EXCEPTION 'Entry emotion required'; END IF;
    v_owner := (SELECT auth.uid());

    IF v_owner IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.trading_sessions
        WHERE id = p_session_id
          AND owner_id = v_owner
          AND status = 'open'
    ) THEN
        RAISE EXCEPTION 'No accessible open session';
    END IF;

    IF p_setup_type IS NULL
       OR btrim(p_setup_type) = ''
       OR p_instrument NOT IN ('NQ','MNQ','ES','MES')
       OR p_direction NOT IN ('long','short')
       OR p_instrument IS NULL
       OR p_direction IS NULL
    THEN
        RAISE EXCEPTION 'Invalid trade parameters';
    END IF;

    IF p_allocations IS NULL
       OR jsonb_typeof(p_allocations) <> 'array'
       OR jsonb_array_length(p_allocations) = 0
    THEN
        RAISE EXCEPTION 'At least one allocation required';
    END IF;

    -- Alle Kontozuordnungen vorab prüfen
    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_allocations)
    LOOP
        IF jsonb_typeof(v_item) <> 'object' THEN
            RAISE EXCEPTION 'Invalid allocation object';
        END IF;

        v_account_id := (v_item->>'account_id')::uuid;
        v_role := v_item->>'role';
        v_instrument := v_item->>'instrument';
        v_quantity := (v_item->>'planned_quantity')::numeric;

        IF v_account_id IS NULL
           OR v_role IS NULL
           OR v_role NOT IN ('leader','follower','manual')
           OR v_instrument IS NULL
           OR v_instrument NOT IN ('NQ','MNQ','ES','MES')
           OR v_quantity IS NULL
           OR v_quantity <= 0
        THEN
            RAISE EXCEPTION 'Invalid allocation parameters';
        END IF;

        IF v_account_id = ANY(v_seen) THEN
            RAISE EXCEPTION 'Duplicate account allocation';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM public.trading_accounts
            WHERE id = v_account_id
              AND owner_id = v_owner
              AND active = true
        ) THEN
            RAISE EXCEPTION 'Account unavailable or inactive';
        END IF;

        v_seen := array_append(v_seen, v_account_id);

        IF v_role = 'leader' THEN
            v_leaders := v_leaders + 1;
        END IF;
    END LOOP;

    IF v_leaders <> 1 THEN
        RAISE EXCEPTION 'Exactly one leader required';
    END IF;

    -- Eine Trading-Entscheidung anlegen
    INSERT INTO public.trades (
        owner_id,
        session_id,
        setup_type,
        instrument,
        direction,
        entry_at,
        entry_emotion,
        observations
    )
    VALUES (
        v_owner,
        p_session_id,
        p_setup_type,
        p_instrument,
        p_direction,
        now(),
        p_entry_emotion,
        jsonb_build_object('entry_emotion',p_entry_emotion)
    )
    RETURNING id INTO v_trade_id;

    -- Alle zugehörigen Konten speichern
    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_allocations)
    LOOP
        INSERT INTO public.trade_account_allocations (
            owner_id,
            trade_id,
            account_id,
            role,
            instrument,
            planned_quantity
        )
        VALUES (
            v_owner,
            v_trade_id,
            (v_item->>'account_id')::uuid,
            v_item->>'role',
            v_item->>'instrument',
            (v_item->>'planned_quantity')::numeric
        );
    END LOOP;

    RETURN v_trade_id;
END;
$function$

CREATE OR REPLACE FUNCTION public.close_session_safely_v718(p_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_session public.trading_sessions%rowtype; v_open bigint;
begin
 if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
 select * into v_session from public.trading_sessions
 where id=p_session_id and owner_id=(select auth.uid()) for update;
 if not found then raise exception 'Session not found'; end if;
 if v_session.status <> 'open' then raise exception 'Session already closed'; end if;
 select count(*) into v_open from public.trades
 where session_id=p_session_id and owner_id=(select auth.uid()) and exit_at is null;
 if v_open>0 then raise exception 'Session contains % open trades',v_open; end if;
 update public.trading_sessions set status='closed',closed_at=clock_timestamp()
 where id=p_session_id and owner_id=(select auth.uid());
 return jsonb_build_object('session_id',p_session_id,'status','closed','open_trades',0);
end $function$

CREATE OR REPLACE FUNCTION public.close_trade_with_emotions_v7(p_trade_id uuid, p_exit_reason text, p_results jsonb, p_exit_emotions text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE v_uid uuid:=auth.uid(); v_result jsonb; v_emotions text[]; v_first text;
BEGIN
 IF v_uid IS NULL OR auth.role()<>'authenticated' THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF p_exit_emotions IS NULL OR cardinality(p_exit_emotions)<1 OR cardinality(p_exit_emotions)>7 THEN RAISE EXCEPTION 'Select 1 to 7 exit emotions'; END IF;
 SELECT array_agg(DISTINCT e ORDER BY e) INTO v_emotions FROM unnest(p_exit_emotions) e;
 IF cardinality(v_emotions)<>cardinality(p_exit_emotions) OR EXISTS(SELECT 1 FROM unnest(v_emotions) e WHERE e IS NULL OR e NOT IN ('disciplined','fear','greed','frustration','relief','uncertainty','stress')) THEN RAISE EXCEPTION 'Invalid or duplicate exit emotions'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.trades WHERE id=p_trade_id AND owner_id=v_uid) THEN RAISE EXCEPTION 'Trade not found'; END IF;
 v_first:=p_exit_emotions[1];
 v_result:=public.close_trade_with_account_results_v7(p_trade_id,p_exit_reason,p_results,v_first);
 UPDATE public.trades SET observations=coalesce(observations,'{}'::jsonb)||jsonb_build_object('exit_emotions',to_jsonb(p_exit_emotions)),updated_at=clock_timestamp() WHERE id=p_trade_id AND owner_id=v_uid;
 IF NOT FOUND THEN RAISE EXCEPTION 'Could not save exit emotions'; END IF;
 RETURN v_result;
END $function$

CREATE OR REPLACE FUNCTION public.guard_trade_session_open_v718()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_status text; v_owner uuid;
begin
 if tg_op = 'INSERT' or (tg_op='UPDATE' and new.session_id is distinct from old.session_id) then
   select status,owner_id into v_status,v_owner
   from public.trading_sessions where id=new.session_id for update;
   if not found or v_owner is distinct from new.owner_id then
     raise exception 'Trade session unavailable for this owner';
   end if;
   if v_status <> 'open' then raise exception 'Cannot create or move a trade into a closed session'; end if;
 end if;
 return new;
end $function$

CREATE OR REPLACE FUNCTION public.guard_session_close_v718()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if old.status='open' and new.status='closed' then
   if exists(select 1 from public.trades
      where session_id=new.id and owner_id=new.owner_id and exit_at is null)
   then raise exception 'Session contains open trades'; end if;
 end if;
 if old.status='closed' and new.status='open' then
   raise exception 'Closed sessions cannot be reopened';
 end if;
 return new;
end $function$

CREATE OR REPLACE FUNCTION public.guard_session_lifecycle_v720()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_open bigint;
begin
 if new.owner_id is distinct from old.owner_id then
   raise exception 'Session ownership cannot change';
 end if;
 if old.status = 'closed' and new.status is distinct from old.status then
   raise exception 'Closed sessions cannot be reopened';
 end if;
 if old.status = 'closed' and new.closed_at is distinct from old.closed_at then
   raise exception 'Closed session timestamp cannot be modified';
 end if;
 if old.status = 'open' and new.status = 'closed' then
   select count(*) into v_open from public.trades
   where session_id = old.id and owner_id = old.owner_id and exit_at is null;
   if v_open > 0 then
     raise exception 'Cannot close session with % open trades',v_open;
   end if;
   if new.closed_at is null then new.closed_at := clock_timestamp(); end if;
 end if;
 return new;
end $function$

CREATE OR REPLACE FUNCTION public.create_trade_with_risk_v732(p_session_id uuid, p_setup_type text, p_instrument text, p_direction text, p_allocations jsonb, p_entry_emotion text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_item jsonb; v_trade uuid; v_ticks numeric; v_qty numeric; v_tick_value numeric; v_calc numeric; v_actual numeric; v_count int:=0;
begin
 if p_allocations is null or jsonb_typeof(p_allocations)<>'array' or jsonb_array_length(p_allocations)=0 then raise exception 'Konten fehlen'; end if;
 for v_item in select value from jsonb_array_elements(p_allocations) loop
  v_count:=v_count+1;
  if jsonb_typeof(v_item)<>'object' then raise exception 'Ungültige Kontodaten'; end if;
  if (v_item->>'initial_sl_ticks') is null or (v_item->>'initial_sl_ticks') !~ '^[0-9]+$' then raise exception 'Initial-SL in ganzen Ticks erforderlich'; end if;
  v_ticks:=(v_item->>'initial_sl_ticks')::numeric;
  v_qty:=(v_item->>'planned_quantity')::numeric;
  v_tick_value:=case v_item->>'instrument' when 'NQ' then 5 when 'MNQ' then 0.5 when 'ES' then 12.5 when 'MES' then 1.25 else null end;
  if v_ticks<=0 or v_ticks>100000 or v_qty is null or v_qty<=0 or v_tick_value is null then raise exception 'Ungültige Risikodaten'; end if;
  v_calc:=round(v_ticks*v_qty*v_tick_value,2);
  if v_calc<=0 then raise exception 'Risiko muss positiv sein'; end if;
 end loop;
 v_trade:=public.create_trade_with_allocations_v7(p_session_id,p_setup_type,p_instrument,p_direction,p_allocations,p_entry_emotion);
 for v_item in select value from jsonb_array_elements(p_allocations) loop
  v_ticks:=(v_item->>'initial_sl_ticks')::numeric;
  v_qty:=(v_item->>'planned_quantity')::numeric;
  v_tick_value:=case v_item->>'instrument' when 'NQ' then 5 when 'MNQ' then 0.5 when 'ES' then 12.5 when 'MES' then 1.25 end;
  v_calc:=round(v_ticks*v_qty*v_tick_value,2);
  update public.trade_account_allocations set initial_sl_points=v_ticks*0.25,calculated_risk_usd=v_calc,initial_risk_usd=v_calc,risk_manually_overridden=false
   where trade_id=v_trade and account_id=(v_item->>'account_id')::uuid and owner_id=(select auth.uid());
  if not found then raise exception 'Risiko-Kontozuordnung fehlt'; end if;
 end loop;
 update public.trades set initial_risk_usd=(select sum(initial_risk_usd) from public.trade_account_allocations where trade_id=v_trade and owner_id=(select auth.uid())) where id=v_trade and owner_id=(select auth.uid());
 return v_trade;
end $function$

CREATE OR REPLACE FUNCTION public.guard_initial_risk_immutable_v732()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if old.initial_risk_usd is not null and
 (new.initial_risk_usd is distinct from old.initial_risk_usd or new.initial_sl_points is distinct from old.initial_sl_points or new.calculated_risk_usd is distinct from old.calculated_risk_usd or new.risk_manually_overridden is distinct from old.risk_manually_overridden) then
 raise exception 'Initialrisiko ist nach der ersten Speicherung gesperrt';
 end if;
 return new;
end $function$

CREATE OR REPLACE FUNCTION public.record_trade_attempt_v733(p_session_id uuid, p_setup_type text, p_instrument text, p_direction text, p_allocations jsonb, p_entry_emotion text, p_idea_id uuid DEFAULT NULL::uuid, p_warning_answers jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare v_idea public.trade_ideas_v733%rowtype;v_attempt integer;v_trade uuid;
begin
if auth.uid() is null then raise exception 'Authentication required';end if;
if p_idea_id is not null then
select * into v_idea from public.trade_ideas_v733 where id=p_idea_id and owner_id=auth.uid() for update;
if not found then raise exception 'Handelsidee nicht gefunden';end if;
if v_idea.status<>'active' or v_idea.session_id<>p_session_id or v_idea.setup_type<>p_setup_type or v_idea.instrument<>p_instrument or v_idea.direction<>p_direction then raise exception 'Idee inaktiv oder Setup/Richtung/Instrument/Session stimmen nicht überein';end if;
select count(*)+1 into v_attempt from public.trade_attempts_v733 where idea_id=p_idea_id;
if v_attempt>=4 and(jsonb_typeof(p_warning_answers)<>'object' or not(p_warning_answers ?& array['thesis','trigger','risk','motivation'])) then raise exception 'Ab Versuch 4 müssen vier Prüfantworten dokumentiert werden';end if;
end if;
v_trade:=public.create_trade_with_risk_v732(p_session_id,p_setup_type,p_instrument,p_direction,p_allocations,p_entry_emotion);
insert into public.trade_attempts_v733(owner_id,trade_id,idea_id,attempt_number,classification,warning_answers) values(auth.uid(),v_trade,p_idea_id,v_attempt,case when p_idea_id is null then 'spontaneous' else 'planned' end,case when v_attempt>=4 then p_warning_answers else null end);
return v_trade;
end $function$

CREATE OR REPLACE FUNCTION public.guard_trade_idea_plan_v733()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
if (new.owner_id,new.session_id,new.setup_type,new.instrument,new.direction,new.thesis,new.trigger_condition,new.invalidation,new.created_at) is distinct from(old.owner_id,old.session_id,old.setup_type,old.instrument,old.direction,old.thesis,old.trigger_condition,old.invalidation,old.created_at) then raise exception 'Der ursprüngliche Handelsplan ist unveränderlich';end if;
return new;
end $function$

CREATE OR REPLACE FUNCTION public.guard_trade_attempt_v734()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare v_trade public.trades%rowtype; v_idea public.trade_ideas_v733%rowtype; v_expected integer;
begin
if tg_op='UPDATE' or tg_op='DELETE' then raise exception 'Einstiegsversuche dürfen nicht nachträglich verändert oder gelöscht werden'; end if;
if new.owner_id is distinct from auth.uid() then raise exception 'Ungültiger Eigentümer';end if;
select * into v_trade from public.trades where id=new.trade_id and owner_id=auth.uid();
if not found then raise exception 'Trade gehört nicht zum Benutzer';end if;
if new.classification='planned' then
select * into v_idea from public.trade_ideas_v733 where id=new.idea_id and owner_id=auth.uid();
if not found or v_idea.session_id<>v_trade.session_id or v_idea.created_at>v_trade.entry_at then raise exception 'Handelsidee muss vor dem dokumentierten Entry bestehen und zur Session gehören';end if;
select coalesce(max(attempt_number),0)+1 into v_expected from public.trade_attempts_v733 where idea_id=new.idea_id;
if new.attempt_number<>v_expected then raise exception 'Versuchsnummer ist nicht fortlaufend';end if;
if v_expected>=4 and (new.warning_answers is null or jsonb_typeof(new.warning_answers)<>'object' or not(new.warning_answers ?& array['thesis','trigger','risk','motivation']) or jsonb_typeof(new.warning_answers->'thesis')<>'boolean' or jsonb_typeof(new.warning_answers->'trigger')<>'boolean' or jsonb_typeof(new.warning_answers->'risk')<>'boolean' or jsonb_typeof(new.warning_answers->'motivation')<>'boolean') then raise exception 'Vier Ja/Nein-Prüfungen erforderlich';end if;
else
if new.idea_id is not null or new.attempt_number is not null then raise exception 'Spontane Trades ohne Handelsidee';end if;
end if;
return new;
end $function$

CREATE TRIGGER trg_log_allocation_changes AFTER INSERT OR DELETE OR UPDATE ON public.trade_account_allocations FOR EACH ROW EXECUTE FUNCTION log_allocation_changes();
CREATE TRIGGER trg_prevent_allocation_owner_change BEFORE UPDATE ON public.trade_account_allocations FOR EACH ROW EXECUTE FUNCTION prevent_allocation_owner_change();
CREATE TRIGGER trg_guard_trade_session_open_v718 BEFORE INSERT OR UPDATE OF session_id ON public.trades FOR EACH ROW EXECUTE FUNCTION guard_trade_session_open_v718();
CREATE TRIGGER trg_guard_session_close_v718 BEFORE UPDATE OF status ON public.trading_sessions FOR EACH ROW EXECUTE FUNCTION guard_session_close_v718();
CREATE TRIGGER trg_guard_session_lifecycle_v720 BEFORE UPDATE ON public.trading_sessions FOR EACH ROW EXECUTE FUNCTION guard_session_lifecycle_v720();
CREATE TRIGGER trg_guard_initial_risk_v732 BEFORE UPDATE ON public.trade_account_allocations FOR EACH ROW EXECUTE FUNCTION guard_initial_risk_immutable_v732();
CREATE TRIGGER trg_guard_trade_idea_plan_v733 BEFORE UPDATE ON public.trade_ideas_v733 FOR EACH ROW EXECUTE FUNCTION guard_trade_idea_plan_v733();
CREATE TRIGGER trg_guard_trade_attempt_v734 BEFORE INSERT OR DELETE OR UPDATE ON public.trade_attempts_v733 FOR EACH ROW EXECUTE FUNCTION guard_trade_attempt_v734();
CREATE INDEX training_goals_v7_owner_created ON public.training_goals_v7 USING btree (owner_id, created_at DESC);
CREATE UNIQUE INDEX attempts733_idea_number ON public.trade_attempts_v733 USING btree (idea_id, attempt_number) WHERE (idea_id IS NOT NULL);
CREATE INDEX trades_owner_session_idx ON public.trades USING btree (owner_id, session_id);
CREATE UNIQUE INDEX allocation_change_log_event_seq_idx ON public.allocation_change_log USING btree (event_seq);
CREATE INDEX trade_ideas_v733_owner_session_idx ON public.trade_ideas_v733 USING btree (owner_id, session_id, created_at DESC);
CREATE INDEX events_owner_trade_idx ON public.trade_events USING btree (owner_id, trade_id);
CREATE INDEX screenshots_owner_trade_idx ON public.screenshots USING btree (owner_id, trade_id);
CREATE UNIQUE INDEX account_fills_import_dedup ON public.account_fills USING btree (allocation_id, source, external_fill_id) WHERE (external_fill_id IS NOT NULL);
CREATE INDEX errors_owner_trade_idx ON public.trade_errors USING btree (owner_id, trade_id);
CREATE INDEX stop_adjustments_allocation_history_idx ON public.stop_adjustments USING btree (allocation_id, changed_at DESC, id DESC) WHERE (allocation_id IS NOT NULL);
CREATE INDEX trading_setup_catalog_owner_sort_idx ON public.trading_setup_catalog USING btree (owner_id, active, sort_order);
CREATE UNIQUE INDEX one_leader_per_trade ON public.trade_account_allocations USING btree (trade_id) WHERE (role = 'leader'::text);
CREATE UNIQUE INDEX trading_setup_catalog_owner_name_unique ON public.trading_setup_catalog USING btree (owner_id, lower(name));
CREATE INDEX trades_owner_entry_idx ON public.trades USING btree (owner_id, entry_at DESC);
ALTER TABLE public."trading_setup_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."training_countermeasures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."training_goals_v7" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."trade_ideas_v733" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."trade_attempts_v733" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."stop_adjustments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."trading_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."trade_ideas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."trades" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."trade_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."screenshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."corrective_actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."trade_errors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."trade_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."playbook_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."trading_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."account_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."account_group_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."account_fills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."trade_account_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."account_trade_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."allocation_change_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trading_sessions_owner_only" ON public."trading_sessions" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "trade_ideas_owner_only" ON public."trade_ideas" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "trades_owner_only" ON public."trades" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "stop_adjustments_owner_only" ON public."stop_adjustments" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "trade_events_owner_only" ON public."trade_events" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "screenshots_owner_only" ON public."screenshots" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "corrective_actions_owner_only" ON public."corrective_actions" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "trade_errors_owner_only" ON public."trade_errors" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "trade_reviews_owner_only" ON public."trade_reviews" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "playbook_entries_owner_only" ON public."playbook_entries" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "trading_accounts_owner_only" ON public."trading_accounts" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "account_groups_owner_only" ON public."account_groups" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "account_group_members_owner_only" ON public."account_group_members" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "trade_account_allocations_owner_only" ON public."trade_account_allocations" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "account_fills_owner_only" ON public."account_fills" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "account_trade_results_owner_only" ON public."account_trade_results" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "allocation_change_log_select" ON public."allocation_change_log" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "v7_charts_select_own" ON storage."objects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((bucket_id = 'trading-chart-screenshots'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));
CREATE POLICY "v7_charts_insert_own" ON storage."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'trading-chart-screenshots'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));
CREATE POLICY "v7_charts_delete_own" ON storage."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'trading-chart-screenshots'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));
CREATE POLICY "trading_setup_catalog_owner_only" ON public."trading_setup_catalog" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "training_countermeasures_owner" ON public."training_countermeasures" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "training_goals_v7_owner" ON public."training_goals_v7" AS PERMISSIVE FOR ALL TO "authenticated" USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "ideas733_select" ON public."trade_ideas_v733" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((owner_id = auth.uid()));
CREATE POLICY "ideas733_insert" ON public."trade_ideas_v733" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((owner_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM trading_sessions s
  WHERE ((s.id = trade_ideas_v733.session_id) AND (s.owner_id = auth.uid()) AND (s.status = 'open'::text))))));
CREATE POLICY "ideas733_update" ON public."trade_ideas_v733" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((owner_id = auth.uid())) WITH CHECK ((owner_id = auth.uid()));
CREATE POLICY "attempts733_select" ON public."trade_attempts_v733" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((owner_id = auth.uid()));
CREATE POLICY "attempts733_insert" ON public."trade_attempts_v733" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((owner_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM trades t
  WHERE ((t.id = trade_attempts_v733.trade_id) AND (t.owner_id = auth.uid())))) AND ((idea_id IS NULL) OR (EXISTS ( SELECT 1
   FROM trade_ideas_v733 i
  WHERE ((i.id = trade_attempts_v733.idea_id) AND (i.owner_id = auth.uid())))))));
CREATE VIEW public."trade_review_status" WITH(security_invoker=true) AS  SELECT t.id AS trade_id,
    t.owner_id,
    r.reviewed_at IS NOT NULL AND NOT (EXISTS ( SELECT 1
           FROM trade_errors e
          WHERE e.trade_id = t.id AND e.owner_id = t.owner_id AND (e.cause IS NULL OR btrim(e.cause) = ''::text OR e.corrective_action_id IS NULL))) AS is_complete
   FROM trades t
     LEFT JOIN trade_reviews r ON r.trade_id = t.id AND r.owner_id = t.owner_id;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_trade_with_allocations(uuid,text,text,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_trade_with_allocations_v7(uuid,text,text,text,jsonb,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_trade_with_risk_v732(uuid,text,text,text,jsonb,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_trade_attempt_v733(uuid,text,text,text,jsonb,text,uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_trade_with_account_results(uuid,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_trade_with_account_results_v7(uuid,text,jsonb,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_trade_with_emotions_v7(uuid,text,jsonb,text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_stop_adjustment(uuid,integer,integer,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_session_safely_v718(uuid) TO authenticated;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('trading-chart-screenshots','trading-chart-screenshots',false,10485760,ARRAY['image/jpeg','image/png','image/webp']);
COMMIT;
