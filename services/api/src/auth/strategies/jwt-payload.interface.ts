/**
 * JWT payload interface — the decoded claims of an access token.
 *
 * Approved claim set (AUTH_V2.md §4):
 *   sub  — user/admin UUID (subject)
 *   aud  — audience: 'jito-player' | 'jito-admin'
 *   role — 'user' for players; AdminRole value for admins
 *   sid  — session UUID (ties the token to a revocable session)
 *   iat  — issued at (UNIX seconds)
 *   exp  — expiry (UNIX seconds)
 *   jti  — JWT ID (unique token identifier for audit)
 */
export interface JwtPayload {
  /** Subject — user UUID (player) or admin UUID (admin) */
  sub: string;
  /** Audience — 'jito-player' | 'jito-admin' */
  aud: string;
  /** Role — 'user' for players; AdminRole enum value for admins */
  role: string;
  /** Session UUID — ties this token to a revocable session row */
  sid: string;
  /** Issued at (UNIX seconds) */
  iat?: number;
  /** Expiry (UNIX seconds) */
  exp?: number;
  /** JWT ID — unique token identifier */
  jti?: string;
}
