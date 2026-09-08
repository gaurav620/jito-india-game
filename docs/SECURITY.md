# JITO INDIA GAMES — Security

---

## 1. Transport Security

- HTTPS everywhere (TLS 1.2+)
- HSTS headers
- Secure WebSocket (WSS)

## 2. Authentication Security

- Passwords hashed with bcrypt (12 rounds)
- JWT with short expiry (1 hour)
- Refresh token rotation
- Rate limiting on auth endpoints
- Account lockout after repeated failures

## 3. Input Validation

- Server-side validation on ALL endpoints
- Parameterized database queries (no SQL injection)
- Input sanitization (XSS prevention)
- File upload validation (type, size)
- Request body size limits

## 4. Authorization

- JWT-based route protection
- Role-based access control (user, admin)
- Resource-level authorization (users can only access own data)
- Admin endpoints on separate route prefix

## 5. Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

## 6. Infrastructure Security

- WAF rules for common attack patterns
- VPC for database and cache (no public access)
- Security groups restrict port access
- Secrets in AWS Secrets Manager (never in code)
- IAM roles with least-privilege principle

## 7. Audit

- All admin actions logged
- All financial transactions logged
- Login attempts logged
- Suspicious activity monitoring (future)
