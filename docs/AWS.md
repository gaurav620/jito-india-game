# JITO INDIA GAMES — AWS Infrastructure

---

## 1. Architecture

| Service | AWS Product | Purpose |
|---------|-------------|---------|
| DNS | Route 53 | Domain management |
| CDN | CloudFront | Static asset delivery |
| Security | WAF | Web application firewall |
| Load Balancer | ALB | Request routing |
| Compute | ECS / Fargate | Container orchestration |
| Database | RDS PostgreSQL | Relational data |
| Cache | ElastiCache Redis | Caching, pub/sub |
| Storage | S3 | Static assets, uploads, installers |
| Monitoring | CloudWatch | Logs, metrics, alarms |
| Secrets | Secrets Manager | Credential management |
| Registry | ECR | Docker image storage |

## 2. Region

- Primary: `ap-south-1` (Mumbai, India)

## 3. Environments

| Environment | Purpose | Infrastructure |
|-------------|---------|----------------|
| Development | Local development | Docker Compose |
| Staging | Pre-production testing | Scaled-down AWS |
| Production | Live system | Full AWS |

## 4. Scaling

- ECS services auto-scale based on CPU/memory
- RDS read replicas if needed
- ElastiCache cluster mode for Redis scaling
- CloudFront for CDN edge caching

## 5. Backups

- RDS: Automated daily backups, 7-day retention
- ElastiCache: Daily snapshots
- S3: Versioning enabled
