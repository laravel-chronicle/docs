---
title: Services
description: Fixed-price Chronicle setup by the maintainer - review, production setup, and compliance setup with KMS signing, external anchoring and auditor handover.
---

# Chronicle setup, by the maintainer

Chronicle is free and MIT licensed, and it stays that way. If you'd rather have it set up for you, I do that for a fixed price.

I'm Vasileios Ntoufoudis, the author and maintainer of Chronicle. I've run Linux servers and Docker in production for 12+ years and build with Laravel.

## Who this is for

- Teams preparing for SOC 2, ISO 27001, PCI DSS or a customer security review.
- Apps that handle money, health data or personal data and need an audit trail that holds up.
- Teams that already run Chronicle and want a second pair of eyes.

## Packages

### Review - €290

For teams that already run Chronicle, or plan to.

- Read-only review of your install or your plan: config, what is audited, signing keys, queue driver, scheduling, verification.
- A written report: findings ranked by risk, each with the fix.
- Delivered in 2-3 working days.

### Standard - €690

Chronicle installed and running in production.

- Install and config tuned for your app.
- Signing keys generated and stored in your secret store, never in the repo.
- Eloquent model auditing for the models you choose.
- Explicit entries for up to 10 security actions (logins, role changes, exports...).
- Actor, IP and request context on every entry.
- Queued writes when your volume needs them, set up so the chain stays in order.
- Scheduled checkpoints and verification, with an alert when verification fails.
- Tests.
- Delivered as a pull request in your repo, with a one-page runbook. About one week.

### Compliance - €1,690

Everything in Standard, plus what an auditor asks for.

- Signing through AWS KMS, or a documented key rotation plan.
- External anchoring to S3 Object Lock, verified on a schedule.
- Scheduled signed exports stored off-system, and signed reports for each audit period.
- GDPR erasure with crypto-shredding, if your entries hold personal data.
- The Filament panel, if your app uses Filament.
- A handover doc for your auditor: what is logged and how to verify reports and exports with standard tools.
- A 45-minute walkthrough call with your team. About two weeks.

**Launch offer:** the first 3 clients get 30% off in exchange for a short testimonial.

## What's not included

- Legal or compliance advice. Chronicle gives you evidence that supports your controls. Your auditor decides.
- Laravel or PHP upgrades to meet Chronicle's requirements (PHP 8.2+, Laravel 12 or 13). I can quote those separately.

## How it works

1. Email [info@ntoufoudis.com](mailto:info@ntoufoudis.com?subject=Chronicle%20setup) with:
   - your Laravel and PHP versions, database and hosting,
   - why you need audit logging (SOC 2, ISO 27001, GDPR, a customer contract...),
   - which models and actions must be logged,
   - your deadline, if you have one.
2. I reply with a fixed quote within 2 working days. If your app needs more than a package covers, the quote says so before any work starts.
3. I work on a branch in your repo. You review and merge the pull request.

Prefer Upwork? The same packages are in my Upwork project catalog.
