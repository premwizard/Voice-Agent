# Production Deployment Guide

This guide details how to deploy the AI Platform to production using Kubernetes or Docker Compose.

## Prerequisites
- Docker & Docker Compose
- Kubernetes Cluster (Optional, for K8s deployment)
- Domain Name & SSL Certificates
- Cloud Provider Account (AWS/GCP/Azure)

## Docker Compose (Single Node Production)

1. **Clone Repository**
   ```bash
   git clone <repo>
   cd ai-platform
   ```

2. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   POSTGRES_USER=appuser
   POSTGRES_PASSWORD=strongpassword
   POSTGRES_DB=ai_platform
   REDIS_PASSWORD=strongredis
   OPENROUTER_API_KEY=your_key
   GEMINI_API_KEY=your_key
   JWT_SECRET=supersecret
   ```

3. **Start Services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Verify Health**
   Navigate to `http://<your-ip>:3000/dashboard/operations` to verify services are healthy.

## Kubernetes (Scalable Production)

1. **Apply Secrets**
   ```bash
   kubectl create secret generic backend-secrets \
     --from-literal=OPENROUTER_API_KEY=... \
     --from-literal=GEMINI_API_KEY=... \
     --from-literal=DATABASE_URL=... \
     --from-literal=REDIS_URL=...
   ```

2. **Apply Deployments**
   ```bash
   kubectl apply -f infrastructure/kubernetes/
   ```

3. **Configure Ingress**
   Update `infrastructure/kubernetes/ingress.yaml` with your domain name and TLS certificates, then apply it.

4. **Monitor**
   Check pod status:
   ```bash
   kubectl get pods -n ai-platform
   ```

## Security Hardening
- NGINX rate limiting is configured at 10 req/s.
- Containers run as non-root user (UID 1000).
- Passwords and API keys must be injected via secure secrets management (AWS Secrets Manager, HashiCorp Vault).
