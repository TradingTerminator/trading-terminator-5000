-- Existing cases start unmarked. Owner access is governed by the existing trades policy.
ALTER TABLE public.trades ADD COLUMN playbook_reference_v814 boolean NOT NULL DEFAULT false;
