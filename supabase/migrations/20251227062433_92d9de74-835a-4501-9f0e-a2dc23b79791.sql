-- Allow admins to update any user profile
CREATE POLICY "Admins can update any profile"
ON public.user_profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));