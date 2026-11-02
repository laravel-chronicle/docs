---
title: Roadmap
description: What's planned for Laravel Chronicle - now, next and later - and how to influence it.
---

# Roadmap

What's planned for Chronicle, in three horizons. Live status for every item is on the [Roadmap board](https://github.com/orgs/laravel-chronicle/projects/3/views/6). To push something up or suggest something new, reply in the [roadmap discussion](https://github.com/laravel-chronicle/core/discussions/104). A real use case moves an item up.

_Last updated: 2 November 2026._

## Principles

- **Verification stays free.** Integrity, verification and security fixes are always in core, under the MIT license.
- **Core stays lean.** Features that need a third-party SDK or are used once live in their own packages.
- **Built on request.** Adapters for more clouds are built when someone needs them.

## Now (November - December 2026)

| Item | What it gives you |
|---|---|
| **[Auth event auditing](https://github.com/laravel-chronicle/core/issues/271)** | Record Laravel's login, logout, failed login, lockout and password reset events with one line of setup |
| **[Verification events](https://github.com/laravel-chronicle/core/issues/272)** | `VerificationPassed` / `VerificationFailed` events, so you can route alerts to mail, Slack or a pager |
| **[`chronicle:verify-report`](https://github.com/laravel-chronicle/core/issues/273)** | Check a compliance report's hash and signature before you send it to an auditor |
| **[`chronicle:doctor`](https://github.com/laravel-chronicle/core/issues/274)** | One command that checks keys, checkpoints, anchoring, encryption and scheduling, with adapter checks plugged in |
| **[Import from `spatie/laravel-activitylog`](https://github.com/laravel-chronicle/core/issues/275)** | A separate package that moves existing activity log history into Chronicle |

## Next (January - March 2027)

| Item | What it gives you |
|---|---|
| **[Archive before prune](https://github.com/laravel-chronicle/core/issues/276)** | Export and verify old entries, then prune them, and the live ledger still verifies |
| **[Verification spec and test vectors](https://github.com/laravel-chronicle/core/issues/277)** | A byte-exact description of every hash and signature, with test cases, so anyone can build a verifier that agrees with core |
| **[Offline browser verifier](https://github.com/laravel-chronicle/core/issues/278)** | One HTML file that verifies exports and reports locally, with nothing to install, for auditors |
| **[JSON reports](https://github.com/laravel-chronicle/core/issues/279)** | `chronicle:report --format=json` for compliance tools |
| **[Public-log anchor](https://github.com/laravel-chronicle/core/issues/280)** | Anchor checkpoints to a free public log (OpenTimestamps or Sigstore Rekor), no cloud account needed |
| **Filament Pro** (paid) | Alerts, an audit evidence pack, auditor access and more, if there is enough interest: [join the waitlist](https://github.com/laravel-chronicle/core/discussions/270) |

## Later

Built when someone needs it:

- Signing with Google Cloud KMS, Azure Key Vault or HashiCorp Vault
- Anchoring to Google Cloud Storage or Azure immutable storage
- Streaming entries to a SIEM (Datadog, Splunk, Elastic)
- Multiple ledgers in one app
- A Laravel Pulse card and a Nova tool

## Not planned

- **A local filesystem anchor.** An anchor on the same host shares a fate with the ledger it protects. See [Security Model](./security-model.md#why-a-same-host-filesystem-anchor-is-not-shipped).
- **Paid verification features.** See Principles.
