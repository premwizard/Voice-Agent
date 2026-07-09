# Disaster Recovery & Operations

## Database Backups (PostgreSQL)

Backups are handled via `pg_dump`. It is recommended to schedule this as a cron job inside Kubernetes or on the VM hosting the Docker cluster.

### Manual Backup
```bash
docker exec -t ai_platform_postgres_1 pg_dumpall -c -U appuser > dump_`date +%d-%m-%Y"_"%H_%M_%S`.sql
```

### Manual Restore
```bash
cat dump_10-10-2026_12_00_00.sql | docker exec -i ai_platform_postgres_1 psql -U appuser
```

## Redis Recovery

Redis is configured with AOF (Append Only File) disabled by default for caching. If you are using Redis for persistent queues, enable AOF in `redis.conf`.
If Redis crashes, Celery tasks in the queue may be lost. Ensure critical tasks (like user registrations or billing) are written to PostgreSQL before queueing.

## Scaling Services

- **Frontend**: Stateless. Can be scaled horizontally (`docker-compose up --scale frontend=3`).
- **Backend**: Stateless (WebSockets use Redis for pub/sub if running multiple instances, though in Phase 10 we rely on a single backend instance for WS connections unless a Redis Pub/Sub adapter is added to FastAPI).
- **Worker**: Easily scalable. Add more workers to increase background processing throughput.

## Incident Response

1. **High Latency / Alerts**: Check the Operations Dashboard (`/dashboard/operations`) for CPU/Memory spikes.
2. **Database Down**: The application will return 500 errors. Restart the DB container and verify volume mounts.
3. **Redis Down**: Caching will fail, and Background tasks will not execute. Restart the Redis container.
