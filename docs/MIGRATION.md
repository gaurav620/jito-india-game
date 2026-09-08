# JITO INDIA GAMES — Migration Plan

---

## 1. Migration Strategy

```
LEGACY (PHP)
    ↓
REFERENCE ANALYSIS
    ↓
NEW SYSTEM BUILD
    ↓
PARALLEL TESTING
    ↓
UAT VALIDATION
    ↓
CONTROLLED CUTOVER
```

## 2. Key Principle

The existing legacy system continues operating during development. No direct replacement until UAT is passed.

## 3. Data Migration Scope

| Data | Priority | Notes |
|------|----------|-------|
| Users | Critical | Usernames, credentials, profiles |
| Wallet balances | Critical | Must be exact |
| Game history | High | Historical records |
| Game results | High | Audit trail |
| Admin users | Medium | May recreate manually |
| System config | Low | Likely different in new system |

> **NEEDS CLIENT CONFIRMATION**: Legacy database format (MySQL? schema?)

## 4. Migration Steps

1. Export legacy database to staging environment
2. Create migration scripts to transform data
3. Validate data integrity after migration
4. Run new system in parallel with migrated data
5. Client UAT on migrated data
6. Coordinate DNS cutover
7. Monitor post-cutover for 30 days

## 5. Rollback Plan

- Legacy system remains available for 30 days post-cutover
- DNS can be switched back within minutes
- Legacy database kept as backup for 90 days

## 6. Cutover Checklist

- [ ] All users migrated and validated
- [ ] All balances verified
- [ ] Admin users created
- [ ] DNS updated
- [ ] SSL certificates configured
- [ ] Installer download URLs updated
- [ ] Client UAT signoff received
- [ ] Legacy system access preserved (read-only)
