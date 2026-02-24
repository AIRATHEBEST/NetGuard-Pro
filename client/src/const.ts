export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// For Supabase-based auth, we redirect to home page where the login modal is shown.
// This prevents redirects to external OAuth portals.
export const getLoginUrl = () => {
  // Return home page URL - the login modal will handle Supabase authentication
  return `${window.location.origin}/`;
};
