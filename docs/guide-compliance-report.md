---
title: Produce a Compliance Report for an Auditor
---

# Produce a Compliance Report for an Auditor

Generate a signed, self-contained HTML report of the ledger that an auditor can receive and verify independently.

## 1. Create a checkpoint first (recommended)

Anchor the chain head before producing the report so the auditor has a verifiable reference point:

```bash
php artisan chronicle:checkpoint
```

## 2. Generate the report

```bash
# Full ledger report
php artisan chronicle:report /tmp/chronicle-report-q1.html

# Scoped to a date range
php artisan chronicle:report /tmp/chronicle-report-q1.html \
    --from=2025-01-01 \
    --to=2025-03-31
```

The command writes a single HTML file. On success, it prints:

```
Entries:    4 821
Chain head: a3f7c9...
Report hash: 8e12bd...
Written to: /tmp/chronicle-report-q1.html
```

## 3. Share the HTML file with the auditor

The file is self-contained: it embeds the entry count, chain head, reporting period, report hash, signature, algorithm, and key id. No database access is needed to read it.

## What the auditor can verify

The report includes a **signature block**: the report hash, the signature, the algorithm and the key id. With the matching public key, an auditor can verify that the report hash was signed by the key identified by `key_id`, and so that the report was produced by your Chronicle install and not edited afterwards.

The public key is not in the report. Give it to the auditor separately, through a channel they trust: `CHRONICLE_PUBLIC_KEY` for Ed25519, or the PEM public key for ECDSA P-256 (local or AWS KMS).

The report hash covers the entry count, the first and last entry ids, the chain head and the reporting period. The HTML shows the count, chain head and period, but not the entry ids, so the hash cannot be recomputed from the HTML alone. For a fully independent check of the entries themselves, also hand over a signed [export](./exports.md); the auditor verifies it with `chronicle:verify-export` or the steps in [Export Verification](./export-verification.md).

### Verify the signature with OpenSSL

Needs OpenSSL 3.0 or newer (`openssl version`). macOS ships LibreSSL, which cannot do this; install OpenSSL 3 with Homebrew.

The signature covers the report hash **as text**, the 64 hex characters shown in the report, not the raw hash bytes.

**Ed25519** (`Algorithm: ed25519`, the default):

```bash
REPORT_HASH='<report hash from the report>'
SIGNATURE='<signature from the report>'
PUBLIC_KEY='<CHRONICLE_PUBLIC_KEY, base64>'

# CHRONICLE_PUBLIC_KEY is the raw 32-byte key. Prefix the standard Ed25519
# public key header so OpenSSL can load it as DER.
{ printf '\060\052\060\005\006\003\053\145\160\003\041\000'; printf '%s' "$PUBLIC_KEY" | base64 -d; } > chronicle-pub.der
printf '%s' "$REPORT_HASH" > report-hash.txt
printf '%s' "$SIGNATURE" | base64 -d > report-sig.bin

openssl pkeyutl -verify -pubin -inkey chronicle-pub.der -keyform DER -rawin -in report-hash.txt -sigfile report-sig.bin
# Signature Verified Successfully
```

**ECDSA P-256** (`Algorithm: ecdsa-p256`, `EcdsaSigningProvider` or the [AWS KMS adapter](./kms-aws.md)), with the PEM public key in `chronicle-pub.pem`:

```bash
REPORT_HASH='<report hash from the report>'
SIGNATURE='<signature from the report>'

printf '%s' "$REPORT_HASH" > report-hash.txt
printf '%s' "$SIGNATURE" | base64 -d > report-sig.bin

openssl dgst -sha256 -verify chronicle-pub.pem -signature report-sig.bin report-hash.txt
# Verified OK
```

Any other output means the signature does not match: the report was changed, or the public key is not the one that signed it.

## Verify it worked

Open the HTML file in a browser - it renders a table with all report fields. Confirm the period, entry count, and chain head match what you expect from `chronicle:stats`.

```bash
php artisan chronicle:stats
```

## See also

- [Compliance Reports](./compliance-reports.md) - report fields, signing, and verification details
- [Checkpoints](./checkpoints.md) - why to checkpoint before reporting
- [Signing & Keys](./signing-and-keys.md) - public key management
