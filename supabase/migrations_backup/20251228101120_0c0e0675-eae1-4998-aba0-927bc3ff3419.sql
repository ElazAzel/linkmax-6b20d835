
-- Add admin read policies to all relevant tables so admins can see ALL platform data

-- Analytics: Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
ON public.analytics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Blocks: Admins can view all blocks  
CREATE POLICY "Admins can view all blocks"
ON public.blocks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Pages: Admins can view all pages
CREATE POLICY "Admins can view all pages"
ON public.pages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- User Profiles: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Friendships: Admins can view all friendships
CREATE POLICY "Admins can view all friendships"
ON public.friendships
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Collaborations: Admins can view all collaborations
CREATE POLICY "Admins can view all collaborations"
ON public.collaborations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Teams: Admins can view all teams
CREATE POLICY "Admins can view all teams"
ON public.teams
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Team Members: Admins can view all team members
CREATE POLICY "Admins can view all team members"
ON public.team_members
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Leads: Admins can view all leads
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Referrals: Admins can view all referrals
CREATE POLICY "Admins can view all referrals"
ON public.referrals
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- User Achievements: Admins can view all achievements
CREATE POLICY "Admins can view all achievements"
ON public.user_achievements
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Shoutouts: Admins can view all shoutouts
CREATE POLICY "Admins can view all shoutouts"
ON public.shoutouts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Bookings: Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- User Templates: Admins can view all templates
CREATE POLICY "Admins can view all templates"
ON public.user_templates
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Template Purchases: Admins can view all purchases
CREATE POLICY "Admins can view all purchases"
ON public.template_purchases
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- User Tokens: Admins can view all tokens
CREATE POLICY "Admins can view all tokens"
ON public.user_tokens
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Token Transactions: Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.token_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Daily Quests Completed: Admins can view all quests
CREATE POLICY "Admins can view all quests"
ON public.daily_quests_completed
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Challenge Progress: Admins can view all challenge progress
CREATE POLICY "Admins can view all challenge progress"
ON public.challenge_progress
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Premium Gifts: Admins can view all gifts
CREATE POLICY "Admins can view all gifts"
ON public.premium_gifts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Referral Codes: Admins can view all referral codes
CREATE POLICY "Admins can view all referral codes"
ON public.referral_codes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Page Likes: Admins can view all likes
CREATE POLICY "Admins can view all page likes"
ON public.page_likes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Page Boosts: Admins can view all boosts
CREATE POLICY "Admins can view all boosts"
ON public.page_boosts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Friend Activities: Admins can view all activities
CREATE POLICY "Admins can view all activities"
ON public.friend_activities
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Template Likes: Admins can view all template likes
CREATE POLICY "Admins can view all template likes"
ON public.template_likes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Booking Slots: Admins can view all slots
CREATE POLICY "Admins can view all slots"
ON public.booking_slots
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Lead Interactions: Admins can view all interactions
CREATE POLICY "Admins can view all interactions"
ON public.lead_interactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
