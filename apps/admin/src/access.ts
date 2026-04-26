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

  const isAdmin =
    currentUser?.status === 'ACTIVE' &&
    (currentUser?.role_code === 'SUPER_ADMIN' ||
      currentUser?.role_code === 'TEACHER' ||
      currentUser?.role_code === 'PROCTOR');
  return {
    canAdmin: !!isAdmin,
  };
}
