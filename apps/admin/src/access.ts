/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(
  initialState:
    | { currentUser?: API.CurrentUser; forbidden?: boolean }
    | undefined,
) {
  const { currentUser, forbidden } = initialState ?? {};

  // If the user is forbidden (403 from /api/auth/me), deny access
  if (forbidden) {
    return { canAdmin: false };
  }

  // Check for admin role in the user's roles array
  const isAdmin = currentUser?.roles?.includes('admin') ?? false;
  return {
    canAdmin: isAdmin,
  };
}
