---
title: Compliance Reports
---

# Compliance Reports

`chronicle:report` generates a signed, self-contained HTML report of the Chronicle ledger. The report is suitable for handing to auditors or storing as evidence.

## Generating a report

```bash
# Full ledger report
php artisan chronicle:report /path/to/report.html

# Report for a specific date range
php artisan chronicle:report /path/to/report.html --from=2025-01-01 --to=2025-03-31
```

The command writes a single HTML file to the given path. The path is required.

## Options

| Option    | Description                                       |
|-----------|---------------------------------------------------|
| `--from=` | Start of the reporting period (Y-m-d or ISO 8601) |
| `--to=`   | End of the reporting period (Y-m-d or ISO 8601)   |

Both options are optional. Omitting them includes all entries.

## Report contents

The generated HTML report contains:

| Field        | Description                                                                        |
|--------------|------------------------------------------------------------------------------------|
| Generated at | UTC timestamp of when the report was created                                       |
| Period       | Date range covered (`--from` / `--to`), or "All entries"                           |
| Entry count  | Number of entries in the period                                                    |
| Chain head   | `chain_hash` of the most recent entry in the period                                |
| First entry  | ID of the first entry in the period (since 1.17.0)                                 |
| Last entry   | ID of the last entry in the period (since 1.17.0)                                  |
| Report hash  | SHA-256 of the canonical report data (entry count, boundaries, chain head, period) |
| Signed data  | The exact canonical JSON the report hash is computed over (since 1.17.0)           |
| Algorithm    | Signing algorithm (e.g. `ed25519`)                                                 |
| Key ID       | Identifier of the signing key                                                      |
| Signature    | Detached signature of the report hash                                              |

The report hash is computed over a canonical JSON structure that includes `generated_at`, `entry_count`, `first_entry_id`, `last_entry_id`, `chain_head`, `from`, and `to`. The signature covers that hash using the active `SigningProvider`.

## Verification

The report is self-contained apart from the public key: the hash, signature, algorithm and key id are embedded in the HTML. An auditor can read the report hash, the signature, the algorithm, and the key id from it, then verify the signature with the corresponding public key.

The public key is not embedded; the auditor gets it from you separately.

Since 1.17.0 the report also shows the **Signed data**: the exact JSON the report hash is computed over. The auditor recomputes its SHA-256, compares it with the report hash, and checks that it matches the numbers on the page. That ties the entry count, entry ids, chain head and period to the signature. Reports from earlier versions do not show the entry ids, so for those only the signature can be checked.

A report summarises the ledger; it does not contain the entries. Pair it with a signed [export](./exports.md) when the auditor needs to check the entries themselves.

Chronicle does not ship a separate `verify-report` command. Verification is done by the recipient with standard tooling. Tested steps, including OpenSSL for Ed25519 and ECDSA P-256, are in [Produce a Compliance Report for an Auditor](./guide-compliance-report.md#what-the-auditor-can-verify).

## Signing

The report is signed by the active `SigningProvider` configured in `config/chronicle.php`. With the default `Ed25519SigningProvider`, the private key must be present via `CHRONICLE_PRIVATE_KEY`.

Note: if signing is not configured, report generation will fail. Ensure signing keys are in place before scheduling this command.

## Example output (abbreviated)

```
Generated:   2026-06-03T08:00:00+00:00
Period:      2025-01-01 – 2025-03-31
Entry count: 4 821
Chain head:  a3f7c9...
First entry: 01JNV8EJFKJVEWRS2R1W4GD5E6
Last entry:  01JQ2M7X4ZK9T1B6RS0C8YH3PD
Report hash: 8e12bd...
Signed data: {"generated_at":"2026-06-03T08:00:00+00:00","entry_count":4821,...}

Algorithm:  ed25519
Key ID:     chronicle-main
Signature:  base64...
```

## See also

- [Exports](./exports.md) - full NDJSON dataset export for independent chain verification
- [Signing & Keys](./signing-and-keys.md) - key management
- [Artisan Commands](./artisan-commands.md) - full command reference
