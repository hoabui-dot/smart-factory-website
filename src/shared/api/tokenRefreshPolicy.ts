/**
 * WEB-SCREENS §4.4 — refresh only for ACCESS_TOKEN_EXPIRED, once.
 */
export function shouldAttemptTokenRefresh(errorCode: string, alreadyRetried: boolean): boolean {
  return !alreadyRetried && errorCode === 'ACCESS_TOKEN_EXPIRED'
}
