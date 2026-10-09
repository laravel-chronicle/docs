---
title: Run Chronicle Writes on a Queue
---

# Run Chronicle Writes on a Queue

Move audit entry persistence off the HTTP request path using the `queued` driver.

## 1. Configure the driver

In `.env`:

```env
CHRONICLE_DRIVER=queued
CHRONICLE_QUEUE=chronicle
```

## 2. Make sure entries are persisted one at a time

Each entry's chain hash builds on the entry before it, so two workers persisting at the same time compete for the same chain head. They cannot fork the chain - `sequence` is uniquely indexed and the chain head is read under a row lock - but depending on your database's isolation level the losing write can fail. The job runs with `tries = 1`, so a failed entry is not retried: it lands in `failed_jobs` and is missing from the ledger until you replay it.

There are two ways to avoid that.

### Option A: a single worker

On a queue with no ordering guarantee (`database`, `redis`, a standard SQS queue), run exactly one worker:

```bash
php artisan queue:work --queue=chronicle --tries=1
```

**One worker. No more.** `--tries=1` matches the job's own single-attempt limit.

In a Supervisor configuration:

```ini
[program:chronicle-worker]
command=php /var/www/artisan queue:work --queue=chronicle --tries=1
numprocs=1
autostart=true
autorestart=true
```

`numprocs=1` is the critical setting.

### Option B: a FIFO queue

Since v1.14 the `queued` driver works on SQS FIFO queues. Chronicle dispatches every entry under one message group, and SQS keeps at most one message per group in flight, so entries are persisted in dispatch order however many workers are running.

The trade-off is throughput: one message group means one entry in flight at a time, so extra workers add no parallelism to the Chronicle queue.

On [Laravel Cloud](https://laravel.com/cloud/docs/queues), add a managed queue and choose the **FIFO** queue type. Laravel Cloud appends `.fifo` to the name, so a FIFO queue named `chronicle` is dispatched to as `chronicle.fifo`:

```env
QUEUE_CONNECTION=cloud
CHRONICLE_DRIVER=queued
CHRONICLE_QUEUE=chronicle.fifo
```

Name the queue explicitly, including the `.fifo` suffix. SQS derives the FIFO message attributes from the queue name, so leaving `CHRONICLE_QUEUE` blank - which dispatches to the connection's default queue - is only safe when that default queue is itself a `.fifo` queue.

Things to know about FIFO behaviour:

- **The message group must stay stable.** It defaults to `chronicle` and is configurable with `CHRONICLE_QUEUE_MESSAGE_GROUP`, but only so that separate ledgers can share one queue. A group that varies per entry would let entries persist out of order.
- **Chronicle sets no deduplication ID.** Laravel generates a unique one per dispatch, so a redelivered entry is never silently discarded inside the queue's five minute deduplication window. Do not rely on the queue to deduplicate audit entries.
- **The group is sent on standard SQS queues too.** A job cannot tell which queue type it ends up on, so Chronicle always supplies the group. AWS treats it on a standard queue as a [fair queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fair-queues.html) marker: no ordering and no throughput limit. SQS-compatible emulators that predate fair queues can reject it, so keep local emulators current.
- **Replaying a failed entry works.** `queue:retry` re-attaches the FIFO attributes when it re-pushes the job. Laravel Cloud managed queues do not support `queue:retry` - retry from the Queues dashboard instead.

## 3. Call Chronicle normally

No application code changes are needed. `Chronicle::record()->...->commit()` dispatches `PersistChronicleEntryJob` instead of writing synchronously:

```php
Chronicle::record()
    ->actor($user)
    ->action('order.created')
    ->subject($order)
    ->commit();
// Returns immediately - persistence happens in the worker
```

## What changes with the queued driver

- **`EntryRecorded` fires in the queue worker**, not in the HTTP request, and only after the entry's transaction has committed. A listener that throws fails the job but the entry stays in the ledger. Before v1.14 the event did not fire at all with this driver. See [Events Reference](./events.md).
- Entries appear in the ledger after the worker processes the job, not immediately.
- Chain hashing happens inside the job under a database transaction with row-level locking.

## Verify it worked

Run the worker once manually and check:

```bash
php artisan queue:work --queue=chronicle --tries=1 --once
php artisan chronicle:stats
```

Entry count should increase by the number of entries committed before the worker ran.

## See also

- [Storage Drivers](./storage-drivers.md) - full queued driver details
- [Config Reference](./config-reference.md) - `queue` config block
- [Events Reference](./events.md) - `EntryRecorded` timing with the queued driver
