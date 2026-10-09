---
title: Events Reference
---

# Events Reference

Chronicle dispatches two Laravel events from `Chronicle\Events\`.

## `EntryRecorded`

```php
Chronicle\Events\EntryRecorded
```

Fired after a Chronicle entry has been successfully persisted.

### Payload

```php
public readonly Entry $entry
```

The fully persisted `Chronicle\Entry\Entry` model.

### When it fires

When and where it fires depends on the storage driver:

| Driver                  | Dispatched by                                    | Where                                               | If a listener throws                                                   |
|-------------------------|--------------------------------------------------|-----------------------------------------------------|------------------------------------------------------------------------|
| `eloquent` / `database` | The `PersistEntry` pipeline stage                | In the request, inside the write transaction        | The entry is rolled back and the exception reaches the `commit()` call |
| `queued`                | `PersistChronicleEntryJob` (since v1.14)         | In the queue worker, after its transaction commits  | The job fails, but the entry stays in the ledger                       |
| `null`                  | Not fired - nothing is persisted                 | -                                                   | -                                                                      |

**Queued driver:** the job computes the chain hash and stores the entry in a transaction, then dispatches the event once that transaction has committed. The job runs with `tries = 1`, so a failed listener is not retried; the failure shows up in `failed_jobs`. Before v1.14 the job never dispatched `EntryRecorded`, so listeners received nothing with this driver.

### Listening

```php
use Chronicle\Events\EntryRecorded;

// In EventServiceProvider
protected $listen = [
    EntryRecorded::class => [
        App\Listeners\NotifyAuditWebhook::class,
    ],
];

// Or inline with a closure
Event::listen(EntryRecorded::class, function (EntryRecorded $event) {
    Log::info('Entry recorded', ['action' => $event->entry->action]);
});
```

---

## `EntryRejected`

```php
Chronicle\Events\EntryRejected
```

Fired when a Chronicle entry is rejected by a validator or policy extension before persisting.

### Payload

```php
public readonly Throwable $reason
public readonly array     $payload
```

| Property   | Type        | Description                                        |
|------------|-------------|----------------------------------------------------|
| `$reason`  | `Throwable` | The exception that caused the rejection            |
| `$payload` | `array`     | The raw entry attributes at the point of rejection |

### When it fires

`EntryRejected` is dispatched by `ChronicleManager` when `commit()` is called and an extension (validator or policy) throws an exception. The entry is never persisted when this event fires.

### Listening

```php
use Chronicle\Events\EntryRejected;

protected $listen = [
    EntryRejected::class => [
        App\Listeners\LogRejectedEntry::class,
    ],
];
```

Example listener:

```php
class LogRejectedEntry
{
    public function handle(EntryRejected $event): void
    {
        Log::warning('Chronicle entry rejected', [
            'reason'  => $event->reason->getMessage(),
            'action'  => $event->payload['action'] ?? null,
            'actor'   => $event->payload['actor_type'] ?? null,
        ]);
    }
}
```

## See also

- [Storage Drivers](./storage-drivers.md) - queued driver behaviour and `EntryRecorded` timing
- [Validation](./validation.md) - built-in validators that trigger `EntryRejected`
- [Policies](./policies.md) - built-in policies that trigger `EntryRejected`
