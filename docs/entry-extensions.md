---
title: Entry Extensions
---

# Entry Extensions

Chronicle supports custom entry extensions that run before the built-in pipeline stages.

This is the main package-level extension point when you need to enrich, validate, or apply policy to entries before Chronicle canonicalizes and hashes them.

## Registration

Register extensions in config:

```php
'extensions' => [
    App\Chronicle\ResolveTenantContext::class,
],
```

Or register them at runtime:

```php
use Chronicle\Facades\Chronicle;

Chronicle::extendEntry(App\Chronicle\ResolveTenantContext::class);
```

## Extension contract

An extension must implement `Chronicle\Contracts\EntryExtension`:

```php
use Chronicle\Contracts\EntryExtension;
use Chronicle\Entry\PendingEntry;
use Chronicle\Pipeline\ExtensionStage;

final class ResolveTenantContext implements EntryExtension
{
    public function stage(): ExtensionStage
    {
        return ExtensionStage::RESOLVE_CONTEXT;
    }

    public function process(PendingEntry $entry): PendingEntry
    {
        $context = $entry->attribute('context', []);
        $context['tenant_id'] = tenant('id');

        $entry->setAttribute('context', $context);

        return $entry;
    }
}
```

## Available stages

Chronicle currently exposes these ordered stages:

- `PREPARE` (v1.16+)
- `VALIDATE`
- `RESOLVE_CONTEXT`
- `POLICY`
- `PROCESS`

All extensions run before Chronicle’s built-in canonicalization, payload hashing, chain hashing, and persistence processors.

## Converting values before validation

Chronicle stores scalars and arrays. A value object or DTO in `diff` or `context` is rejected by the built-in validators, and its string form is not always what you want recorded: a money object might print as `$5.00` while your application stores `500`.

A `PREPARE` extension runs before every validator, so it can turn those values into what the entry should record:

```php
use App\Support\Currency;
use Chronicle\Contracts\EntryExtension;
use Chronicle\Entry\PendingEntry;
use Chronicle\Pipeline\ExtensionStage;

final class StoreCurrencyAsMinorAmount implements EntryExtension
{
    public function stage(): ExtensionStage
    {
        return ExtensionStage::PREPARE;
    }

    public function process(PendingEntry $entry): PendingEntry
    {
        $diff = $entry->attribute('diff');

        if (! is_array($diff)) {
            return $entry;
        }

        array_walk_recursive($diff, function (mixed &$value): void {
            if ($value instanceof Currency) {
                $value = $value->toMinorAmount();
            }
        });

        $entry->setAttribute('diff', $diff);

        return $entry;
    }
}
```

Register it under `extensions` in `config/chronicle.php`, or with `Chronicle::extendEntry(StoreCurrencyAsMinorAmount::class)`.

`HasChronicle` diffs already record the value a cast stores (see [How cast attributes appear in diffs](./auditing-eloquent-models.md#how-cast-attributes-appear-in-diffs)), so a `PREPARE` extension is mainly for values you pass to `->diff()`, `->change()` or `->context()` yourself.

Before v1.16, use a `VALIDATE` extension with a low priority instead.

## Priority ordering

If you need deterministic ordering within a stage, also implement `Chronicle\Contracts\PrioritizedEntryExtension`:

```php
use Chronicle\Contracts\PrioritizedEntryExtension;

public function priority(): int
{
    return -10;
}
```

Lower priority values execute first.

The registry sorts extensions by:

1. stage
2. priority
3. class name
4. registration order

## What extensions should do

Good use cases:

- inject deterministic context
- enforce domain-specific validation
- apply auditing policy
- attach metadata derived from request or tenant state

Avoid non-deterministic mutations that would make reproducibility harder, especially anything that depends on unstable ambient state without recording it into the entry itself.

## Working with `PendingEntry`

Extensions receive a `PendingEntry`, which gives access to the mutable pre-persistence attributes and payload.

Typical operations:

- `attribute()`
- `setAttribute()`
- `payload()`
- `setPayload()`

## When not to use extensions

Do not use extensions when a simple explicit call in application code is clearer. Chronicle favors explicit audit intent, so extensions should be reserved for cross-cutting concerns rather than routine domain logging.
