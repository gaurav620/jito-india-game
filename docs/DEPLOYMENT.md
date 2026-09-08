# JITO INDIA GAMES — Deployment

---

## 1. Deployment Pipeline

```
feature/* branch
    ↓ Pull Request
develop branch
    ↓ CI (lint, typecheck, test, build)
staging deployment
    ↓ UAT approval
main branch
    ↓ CI + deployment
production
```

## 2. Docker

- Each service has its own Dockerfile
- Multi-stage builds for minimal images
- Images pushed to AWS ECR

## 3. CI/CD (GitHub Actions)

### On Pull Request
- Lint
- Typecheck
- Unit tests
- Build

### On merge to develop
- All above + deploy to staging

### On merge to main
- All above + deploy to production

## 4. Rollback

- ECS: Revert to previous task definition revision
- Database: Point-in-time recovery
- Instant rollback possible via blue/green deployments

## 5. Environment Variables

- Development: `.env` file (local only)
- Staging/Production: AWS Secrets Manager → ECS task definition
