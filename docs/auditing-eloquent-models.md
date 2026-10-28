---
title: Auditing Eloquent Models
---

# Auditing Eloquent Models

Chronicle provides two opt-in mechanisms for automatically recording audit entries when Eloquent models change: the `HasChronicle` trait (for your own models) and `ChronicleModelObserver` (for third-party models you cannot modify).

Both are **explicit opt-in** - Chronicle never attaches global observers automatically.

## `HasChronicle` trait

Add the trait to any Eloquent model you want to audit:

```php
use Chronicle\Eloquent\HasChronicle;

class Order extends Model
{
    use HasChronicle;
}
```

Chronicle will record entries on `created`, `updated`, and `deleted` model events. For `updated`, it skips entries when the only changes are timestamp fields.

### Default behaviour

| Event     | Action recorded                               |
|-----------|-----------------------------------------------|
| `created` | `order.created`                               |
| `updated` | `order.updated` (with diff, if changes exist) |
| `deleted` | `order.deleted`                               |

The action prefix defaults to `snake_case` of the model's base class name (e.g. `OrderItem` -> `order_item`).

The actor defaults to `Auth::user() ?? 'system'`.

### Customising recorded events

Declare `$chronicleEvents` to limit which lifecycle events are audited:

```php
class Order extends Model
{
    use HasChronicle;

    protected array $chronicleEvents = ['created', 'deleted']; // skip 'updated'
}
```

Set it to `[]` to record nothing for that model.

### Ignoring specific fields in diffs

Declare `$chronicleIgnore` to exclude fields from the `updated` diff:

```php
class Order extends Model
{
    use HasChronicle;

    protected array $chronicleIgnore = ['last_synced_at', 'cache_key'];
}
```

`created_at` and `updated_at` are always excluded by default. The entry is still recorded when only ignored fields change; it just carries no diff.

### Redacting sensitive fields in diffs

A model's `$hidden` attributes and its encrypted casts (`encrypted`, `encrypted:array` and the other `encrypted:*` casts, `AsEncryptedArrayObject`, `AsEncryptedCollection`) are redacted automatically: the diff records that the field changed, with `[redacted]` in place of both the old and the new value. Declare `$chronicleRedact` to redact further fields:

```php
class Customer extends Model
{
    use HasChronicle;

    protected $hidden = ['password'];              // redacted automatically

    protected array $chronicleRedact = ['tax_id']; // redacted as well
}
```

Use `$chronicleIgnore` when a change is not worth auditing at all, and `$chronicleRedact` when the change matters but the value must not reach the ledger. Entries are immutable, so a value written in the clear cannot be removed later.

### How cast attributes appear in diffs

The diff records each value as it is stored in the database, not as the model's casts return it, so both sides have the same shape:

| Cast | Recorded as | Example |
|---|---|---|
| none | the stored value | `"Alice"` -> `"Bob"` |
| `bool`, `int`, `float`, `string` | the cast value, on both sides | `false` -> `true` |
| `datetime`, `date`, `immutable_datetime` | the stored date string | `"2026-02-01 12:00:00"` -> `"2026-02-02 12:00:00"` |
| backed enum | its backing value | `"draft"` -> `"live"` |
| `array`, `json`, `collection` | the stored JSON string | `'{"a":1}'` -> `'{"a":2}'` |
| encrypted casts | `[redacted]` | `"[redacted]"` -> `"[redacted]"` |
| custom cast | what its `set()` stores | a `Money` cast that stores cents: `500` -> `750` |

If a custom cast's `set()` returns a date, an enum or a `Stringable` object instead of a scalar, Chronicle records the scalar it is stored as.

A custom cast whose `set()` returns a new object on every call makes Laravel treat the attribute as changed even when the value is the same. Implement `ComparesCastableAttributes` on the cast so that an unchanged value is not reported as a change. See [Comparing Cast Values](https://laravel.com/docs/eloquent-mutators#comparing-cast-values) in the Laravel docs.

:::note
Before 1.15.1, an update to a `datetime`, enum or object-returning custom cast failed with an `InvalidDiffException` after the row was saved, so the change was not audited. An `encrypted` cast's previous value was also recorded in plaintext unless the field was hidden or listed in `$chronicleRedact`.
:::

### Using methods instead of properties

Each of the three settings can also be defined by overriding a method of the same name. Use this when the value has to be computed:

```php
class Order extends Model
{
    use HasChronicle;

    protected function chronicleEvents(): array
    {
        return ['created', 'deleted'];
    }

    protected function chronicleIgnore(): array
    {
        return ['last_synced_at', 'cache_key'];
    }

    protected function chronicleRedact(): array
    {
        return config('audit.redacted_order_fields', []);
    }
}
```

If a model defines both, the method wins. A property must be an array of strings; anything else throws a `LogicException` when the model is saved.

:::note
The methods are available from 1.15.0. In 1.9.1 through 1.14.0, declaring any of these properties on the class that uses `HasChronicle` fails with a PHP "define the same property" error. On those versions, put `use HasChronicle;` on a base model and declare the properties on the model that extends it.
:::

### Other overridable methods

Override these protected methods in your model for finer control:

```php
class Order extends Model
{
    use HasChronicle;

    // Change the actor resolution
    protected function chronicleActor(): mixed
    {
        return $this->assignedUser ?? Auth::user() ?? 'system';
    }

    // Change the action prefix
    protected function chronicleActionPrefix(): string
    {
        return 'shop.order'; // produces: shop.order.created, etc.
    }
}
```

## `Chronicle::observe()` for third-party models

When you cannot add `HasChronicle` to a model directly (e.g. a package model), register a `ChronicleModelObserver`:

```php
// Register in a ServiceProvider
use Chronicle\Facades\Chronicle;

// Use the default observer
Chronicle::observe(Invoice::class);

// Use a custom observer subclass
Chronicle::observe(Invoice::class, InvoiceObserver::class);
```

### Writing a custom observer

Extend `ChronicleModelObserver` and override any protected method:

```php
use Chronicle\Eloquent\ChronicleModelObserver;
use Illuminate\Database\Eloquent\Model;

class InvoiceObserver extends ChronicleModelObserver
{
    // Restrict to specific events
    protected function recordedEvents(): array
    {
        return ['created', 'updated'];
    }

    // Custom actor resolution
    protected function resolveActor(Model $model): Model|string
    {
        return Auth::user() ?? 'billing-system';
    }

    // Custom action prefix
    protected function actionPrefix(Model $model): string
    {
        return 'billing.invoice';
    }

    // Extra fields to exclude from diffs (merged with timestamps)
    protected array $ignoredFields = ['stripe_metadata', 'pdf_cache'];

    // Extra fields to redact in diffs (the model's $hidden attributes always are)
    protected array $redactedFields = ['tax_id'];
}
```

The base `ChronicleModelObserver` records `created`, `updated`, and `deleted` by default, derives the action prefix from `snake_case` of the model class name, and uses `Auth::user() ?? 'system'` as the actor.

## Low magic

Chronicle's Eloquent integration is deliberately explicit. You must opt each model in individually. There are no global hooks, no automatic activity recording, and no framework-level interception. Every audit entry that Chronicle records is the result of a deliberate developer decision - either a direct `Chronicle::record()` call or an explicit observer registration.

## See also

- [Recording Entries](./recording-entries.md) - the `EntryBuilder` API used under the hood
- [Diff Engine](./diff-engine.md) - how diffs are structured
- [Testing Helpers](./testing-helpers.md) - asserting model-triggered entries in tests
