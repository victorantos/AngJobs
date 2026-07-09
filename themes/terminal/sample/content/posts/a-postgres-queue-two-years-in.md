---
title: "A Postgres job queue, two years and 40 million jobs later"
date: 2026-05-19
description: "The SKIP LOCKED queue that runs Copperline: schema, worker loop, failure handling, and the actual latency numbers."
tags:
  - postgres
  - infrastructure
example: true
---

When I started Copperline I needed a job queue for check scheduling, alert fan-out, and email. The conventional advice was Redis plus a queue library. I put it in Postgres instead, because the jobs' *source of truth* was already there, and a queue you can `JOIN` against your own tables is worth a lot of Redis.

Two years and roughly 40 million jobs later, here's the whole thing.

## The schema

One table. The only clever part is the partial index, which keeps the hot set tiny no matter how much history you retain:

```sql
create table jobs (
  id          bigint generated always as identity primary key,
  kind        text        not null,
  payload     jsonb       not null default '{}',
  run_at      timestamptz not null default now(),
  attempts    int         not null default 0,
  max_attempts int        not null default 5,
  locked_at   timestamptz,
  done_at     timestamptz,
  last_error  text
);

create index jobs_ready_idx on jobs (run_at)
  where done_at is null and locked_at is null;
```

Claiming work is one statement. `SKIP LOCKED` is the entire trick — ten workers can hammer this concurrently and never fight:

```sql
update jobs set locked_at = now(), attempts = attempts + 1
where id in (
  select id from jobs
  where done_at is null and locked_at is null and run_at <= now()
  order by run_at
  limit 10
  for update skip locked
)
returning id, kind, payload, attempts, max_attempts;
```

## The worker

The worker is a loop, not a framework. Failures reschedule with exponential backoff; a job that exhausts its attempts stays in the table with its error, which has made postmortems embarrassingly easy:

```js
async function tick(pool, handlers) {
  const { rows } = await pool.query(CLAIM_SQL);
  for (const job of rows) {
    try {
      await handlers[job.kind](job.payload);
      await pool.query('update jobs set done_at = now() where id = $1', [job.id]);
    } catch (err) {
      const backoff = Math.min(2 ** job.attempts, 300); // seconds, capped
      await pool.query(
        `update jobs set locked_at = null, last_error = $2,
           run_at = now() + make_interval(secs => $3)
         where id = $1 and attempts < max_attempts`,
        [job.id, String(err), backoff],
      );
    }
  }
  return rows.length;
}
```

Deployment is systemd, not Kubernetes. Watching the queue in production is `psql`, which is half the reason I like this design:

```sh
psql "$DATABASE_URL" -c "
  select kind, count(*) filter (where done_at is null) as pending,
         max(attempts) as worst
  from jobs group by kind order by pending desc"
```

## The numbers

Measured over the last 90 days, from enqueue to handler start, one modest 4-vCPU database doing plenty of other work at the same time:

| Percentile | Latency | Notes |
| ---------- | ------- | ----- |
| p50 | 38 ms | idle→claim on the next tick |
| p95 | 210 ms | tick interval dominates |
| p99 | 1.4 s | backoff retries included |
| max | 41 s | one incident, see below |

The 41-second outlier was an unindexed `payload` query I added in a hurry — the fix was the partial index above, which I had somehow dropped in a migration. The queue itself has never been the bottleneck.

## What I'd tell you to copy

Not the code — the shape. Keep jobs where your data is until the day profiling tells you otherwise. For me, at ~50k jobs/day, that day is nowhere in sight.
