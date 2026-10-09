---
title: Storage Drivers
---

# Storage Drivers

Chronicle persists entries through a configurable storage driver.

## Built-in drivers

## `eloquent` / `database`

`eloquent` is the default production driver. `database` is an alias - both resolve to the same synchronous implementation (`DatabaseDriver`).

Despite the name, this driver does **not** use Eloquent model events. It writes entries through Laravel’s raw DB query builder to avoid timestamp machinery and observer interference. It respects the configured `connection` and `tables` settings.

Use it for normal application audit logging.

## `queued`

The `queued` driver dispatches entry persistence to a background job (`PersistChronicleEntryJob`) instead of writing synchronously.

**Critical constraint:** each entry's chain hash builds on the entry before it, so entries must be persisted one at a time. There are two ways to guarantee that.

**A single worker.** On a queue with no ordering guarantee (`database`, `redis`, a standard SQS queue), run exactly **one** worker on the Chronicle queue:

```bash
php artisan queue:work --queue=chronicle --tries=1
```

Concurrent workers cannot fork the chain - `sequence` is uniquely indexed and the chain head is read under a row lock - but they race for it, and depending on your database's isolation level the losing write can fail. The job runs with `tries = 1`, so that entry lands in `failed_jobs` and is missing from the ledger until you replay it.

**A FIFO queue.** Since v1.14 the driver also works on SQS FIFO queues, including Laravel Cloud managed FIFO queues. Every entry is dispatched under one message group (`queue.message_group`, default `chronicle`), and SQS keeps at most one message per group in flight, so ordering holds however many workers run - at the cost of one entry in flight at a time. See [Run Chronicle Writes on a Queue](./guide-queue-driver.md#option-b-a-fifo-queue) for setup.

Configure the queue in `config/chronicle.php`:

```php
'queue' => [
    'connection'    => env('CHRONICLE_QUEUE_CONNECTION'),
    'name'          => env('CHRONICLE_QUEUE', 'chronicle'),
    'message_group' => env('CHRONICLE_QUEUE_MESSAGE_GROUP', 'chronicle'),
],
```

**What the job does:** the job receives the pre-validated, pre-hashed payload attributes. Inside a database transaction it acquires a row-level lock, computes the chain hash, and persists the entry via `DatabaseDriver`.

**Event timing:** since v1.14, `EntryRecorded` is dispatched by the job in the queue worker, after its transaction has committed. A listener that throws fails the job but cannot roll back the entry. Before v1.14 the event was not fired with this driver. See [Events Reference](./events.md#when-it-fires).

## `array`

This driver stores entries in memory.

It is useful for tests and non-persistent inspection scenarios. It does not write to the database.

Useful methods:

- `ArrayDriver::all()`
- `ArrayDriver::count()`
- `ArrayDriver::flush()`

## `null`

This driver discards entries silently and returns a hydrated unsaved `Entry` model.

Use it when:

- you want Chronicle calls to succeed without persistence
- you are disabling audit writes in a local environment
- tests do not care about recorded entries

## Configuration

Select the driver in `config/chronicle.php`:

```php
'driver' => env('CHRONICLE_DRIVER', 'eloquent'),
```

## Custom drivers

Chronicle supports custom storage drivers through `extendDriver()`:

```php
use Chronicle\Contracts\StorageDriver;
use Chronicle\Facades\Chronicle;

Chronicle::extendDriver('custom', function (): StorageDriver {
    return new App\Chronicle\CustomDriver();
});
```

Your custom driver must implement `Chronicle\Contracts\StorageDriver`.

## Important resolver rules

- reserved names cannot be overridden: `eloquent`, `array`, `null`
- a custom driver name can only be registered once
- the driver factory must resolve to a valid `StorageDriver`

## Choosing the right driver

- use `eloquent` in production
- use `array` when you want test-time inspection
- use `null` when you want Chronicle calls to no-op cleanly

For most applications, changing the driver is an environment concern rather than a code concern.
