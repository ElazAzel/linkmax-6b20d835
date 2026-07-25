// Authentication should land on the account home, not open the editor without
// an explicit user action. Deep links still retain their requested return path.
export const NEW_USER_BUILDER_ROUTE = '/dashboard/home?welcome=1';
export const NEW_USER_BUILDER_SESSION_KEY = 'new_user_builder_redirect_pending';
