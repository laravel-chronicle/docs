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
| Report hash  | SHA-256 of the canonical report data (entry count, boundaries, chain head, period) |
| Algorithm    | Signing algorithm (e.g. `ed25519`)                                                 |
| Key ID       | Identifier of the signing key                                                      |
| Signature    | Detached signature of the report hash                                              |

The report hash is computed over a canonical JSON structure that includes `generated_at`, `entry_count`, `first_entry_id`, `last_entry_id`, `chain_head`, `from`, and `to`. The signature covers that hash using the active `SigningProvider`.

## Verification

The report is self-contained apart from the public key: the hash, signature, algorithm and key id are embedded in the HTML. An auditor can read the report hash, the signature, the algorithm, and the key id from it, then verify the signature with the corresponding public key.

The public key is not embedded; the auditor gets it from you separately. The HTML shows the entry count, chain head and period, but not the first and last entry ids that the hash also covers, so an auditor can verify the signature but cannot recompute the report hash from the HTML alone. Pair the report with a signed [export](./exports.md) when the auditor needs to check the entries themselves.

Chronicle does not ship a separate `verify-report` command. Verification is done by the recipient with standard tooling. Tested OpenSSL steps for Ed25519 and ECDSA P-256 are in [Produce a Compliance Report for an Auditor](./guide-compliance-report.md#verify-the-signature-with-openssl).

## Signing

The report is signed by the active `SigningProvider` configured in `config/chronicle.php`. With the default `Ed25519SigningProvider`, the private key must be present via `CHRONICLE_PRIVATE_KEY`.

Note: if signing is not configured, report generation will fail. Ensure signing keys are in place before scheduling this command.

## Example output (abbreviated)

```
Generated:   2026-06-03T08:00:00+00:00
Period:      2025-01-01 – 2025-03-31
Entry count: 4 821
Chain head:  a3f7c9...
Report hash: 8e12bd...

Algorithm:  ed25519
Key ID:     chronicle-main
Signature:  base64...
```

## See also

- [Exports](./exports.md) - full NDJSON dataset export for independent chain verification
- [Signing & Keys](./signing-and-keys.md) - key management
- [Artisan Commands](./artisan-commands.md) - full command reference
