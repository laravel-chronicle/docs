---
title: Compliance Evidence
description: How Chronicle's tamper-evident ledger, signed exports and reports support logging and integrity controls in SOC 2, ISO 27001, PCI DSS, HIPAA and GDPR, and what stays your job.
---

# Compliance Evidence

Auditors ask two questions about an audit log: does it record the right events, and can you prove nobody changed it? Chronicle answers the second one with cryptography, and gives you a clean place to answer the first.

This page maps Chronicle's features to the logging and integrity controls of common frameworks. It is a starting point for your own control documentation, not legal or compliance advice.

:::warning
**Chronicle gives you evidence that supports these controls. It does not make you compliant.** Your auditor decides whether your controls are met, and most of these controls also cover systems and processes outside Chronicle. Control names below are short summaries. Check the exact wording in the version of the framework you are audited against.
:::

## What Chronicle produces

| Evidence | What it proves | Docs |
|---|---|---|
| Hash-chained ledger | Any change, deletion, insertion or reordering of an entry is detected by `chronicle:verify` | [Security Model](./security-model.md) |
| Signed checkpoints | The ledger head at a point in time, signed with your key | [Checkpoints](./checkpoints.md) |
| External anchors | A full rewrite of the database, even one re-signed with a stolen key, no longer matches the anchor | [External Anchoring](./anchoring.md) |
| Signed exports | A dataset that can be verified away from your app: complete, unmodified, and signed by your key | [Export Verification](./export-verification.md) |
| Signed compliance reports | Entry count and chain head for an audit period, signed by your key | [Compliance Reports](./compliance-reports.md) |
| Crypto-shredding | A subject's personal data can be made unreadable while the ledger still verifies | [GDPR Erasure](./gdpr-erasure.md) |

Every entry records the actor, the action, the subject and a UTC timestamp. Context resolvers can add the request IP, user agent, URL and request id. See [Data Model](./data-model.md) and [Context Resolvers](./context-resolvers.md).

## Control mapping

Each table lists what a control asks for in short, what Chronicle contributes, and what stays with you.

### SOC 2 (Trust Services Criteria)

| Criterion | Chronicle contributes | You still own |
|---|---|---|
| **CC7.2** Monitor system components for anomalies that could be security events | A tamper-evident record of the security-relevant actions you choose to log. Scheduled `chronicle:verify` with an alert when the ledger has been altered | Choosing which events to log, monitoring infrastructure and everything outside the app |
| **CC7.3** Evaluate security events to decide whether they are incidents | Reliable evidence for an investigation: who did what, to which record, when, with proof the record was not changed afterwards | The incident response process |

### ISO/IEC 27001:2022 (Annex A)

| Control | Chronicle contributes | You still own |
|---|---|---|
| **8.15 Logging**: produce, store, protect and analyse logs | Protection of the logs: append-only entries and hash chaining, two of the protection techniques ISO/IEC 27002 lists for this control. Signed exports for storage outside the app | What to log, retention, log review, clock synchronisation (8.17) |
| **5.33 Protection of records**: protect records from falsification, loss and unauthorised access | Falsification is detectable. Signed exports and external anchors keep verifiable copies outside the application database | Backups, access control to the database, the retention schedule |
| **5.28 Collection of evidence** | Signed exports and reports that keep their integrity after they leave your systems | Your evidence handling procedure |

### PCI DSS v4.0.1 (Requirement 10)

| Requirement | Chronicle contributes | You still own |
|---|---|---|
| **10.2.2** Each event records user, event type, date and time, success or failure, origin, and affected resource | Actor, action, subject and UTC timestamp on every entry. Origin through `RequestContextResolver` (IP, user agent) | Recording failures as well as successes (in the action name or metadata), and logging every event 10.2.1 lists |
| **10.3.2** Audit log files are protected to prevent modifications by individuals | Detection of any modification | Prevention: restrict who can write to the audit database. A [dedicated audit database](./guide-dedicated-audit-database.md) helps |
| **10.3.3** Logs are promptly backed up to a central server or media that is difficult to modify | Scheduled signed exports to storage outside the app. Checkpoint digests anchored to S3 Object Lock | Export frequency (how prompt "promptly" is), the target storage |
| **10.3.4** File integrity monitoring or change detection on audit logs, so changes raise alerts | `chronicle:verify` on a schedule. It exits non-zero on any failure, so the scheduler can alert you (see below) | Who receives the alert and how it is handled |
| **10.5.1** Keep 12 months of audit log history, the last 3 months immediately available | Chronicle never deletes entries on its own. Pruning is opt-in. Exports keep older periods verifiable | Retention settings of at least 365 days, archive storage for exports |

### HIPAA Security Rule (45 CFR 164.312)

| Standard | Chronicle contributes | You still own |
|---|---|---|
| **164.312(b) Audit controls** (required): record and examine activity in systems that contain ePHI | Recording, with tamper evidence | Examining the records: regular review |
| **164.312(c)(1) Integrity** and **(c)(2) Mechanism to authenticate ePHI** (addressable): protect ePHI from improper alteration or destruction, and corroborate it was not altered | For models you audit with Chronicle, a verifiable history of their changes (diffs). It proves the audit trail is intact; it does not by itself protect the ePHI in your application tables | Integrity controls on the ePHI itself |

### GDPR

| Article | Chronicle contributes | You still own |
|---|---|---|
| **Art. 5(1)(f)** integrity and confidentiality, **Art. 5(2)** accountability | A verifiable record of what was done with personal data, and by whom. Optional encryption of personal fields | The lawful basis, and the rest of your accountability documentation |
| **Art. 17** right to erasure | Crypto-shredding: destroy a subject's key and their personal data becomes unreadable, while the ledger still verifies | Backups taken before the erasure still hold the old key: expire them within your erasure deadline. See [Security Model](./security-model.md#erasure-completeness-live-store-vs-backups) |
| **Art. 32(1)** security of processing: (a) encryption, (b) ongoing integrity, (d) regular testing | (a) payload encryption, (b) tamper evidence, (d) scheduled verification as a regular test of the log's integrity | The rest of your security measures |

## Alert when verification fails

Several controls above ask for change detection that raises an alert. `chronicle:verify` exits non-zero when anything fails, so Laravel's scheduler can notify you:

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('chronicle:checkpoint')->hourly();

Schedule::command('chronicle:verify --anchors')
    ->daily()
    ->emailOutputOnFailure('security@example.com');
```

A full verify walks the whole ledger, which is what catches a change to an old entry. Drop `--anchors` if you have not set up [external anchoring](./anchoring.md). `emailOutputOnFailure` needs Laravel mail configured; any `onFailure()` hook works too.

On a large ledger a daily full pass gets slow. Modes like `--since-last-checkpoint` are cheaper but trust the checkpoints they start from, so they catch less. [Scalable Verification](./scalable-verification.md) explains the trade-offs; keep a full pass on some schedule.

## What to hand your auditor

For each audit period:

1. **A signed compliance report** for the period. The auditor checks that the report hash matches the data on the page (Chronicle 1.17.0 and later) and verifies the signature with OpenSSL: [steps](./guide-compliance-report.md#what-the-auditor-can-verify).
2. **A signed export** of the same period. It lets the auditor check the entries themselves, not just the report: [Export Verification](./export-verification.md).
3. **Your public key**, through a channel the auditor trusts (not inside the report).
4. **Proof of scheduled verification**: the scheduler configuration and recent run output.
5. **A short description of what is logged**: which models and actions, which context, the retention period, and where exports are stored.

## What Chronicle does not cover

- **What gets logged.** Chronicle records what your application tells it to. If the app records false events or skips events, Chronicle preserves that faithfully.
- **Prevention.** Chronicle makes tampering detectable, not impossible. Access control to the database is yours.
- **Key management.** A stolen signing key can produce valid signatures. External anchors limit the damage; protecting the key is your job. See [Signing & Keys](./signing-and-keys.md).
- **Clock synchronisation.** Timestamps come from your servers.
- **Log review.** Most frameworks ask for regular review. Chronicle makes the records reliable; someone still has to read them.

## Need help?

The maintainer offers fixed-price setup, including a Compliance package with KMS signing, external anchoring, scheduled exports and reports, and a handover document for your auditor. See [Services](/services).
