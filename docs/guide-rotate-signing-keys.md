---
title: Rotate Signing Keys
---

# Rotate Signing Keys

Replace the Ed25519 signing key without losing the ability to verify existing checkpoints and exports created under the old key.

## Before you start

Chronicle verification uses the **active** provider — it does not resolve historical keys by `key_id`. Any checkpoint or export artifact created under the old key must be re-verified (or archived with a note) before you retire that key.

## 1. Verify the current ledger

Confirm the ledger is clean before rotating:

```bash
php artisan chronicle:verify
```

Fix any failures before continuing.

## 2. Create a checkpoint with the old key

Anchor the chain head under the current key so you have a signed reference to the state immediately before rotation:

```bash
php artisan chronicle:checkpoint
```

Note the checkpoint id in the output — record it externally alongside the current `CHRONICLE_PUBLIC_KEY` if you need to verify that artifact later.

## 3. Generate a new keypair

```bash
php -r '
$kp = sodium_crypto_sign_keypair();
echo "CHRONICLE_PRIVATE_KEY=" . base64_encode(sodium_crypto_sign_secretkey($kp)) . PHP_EOL;
echo "CHRONICLE_PUBLIC_KEY="  . base64_encode(sodium_crypto_sign_publickey($kp))  . PHP_EOL;
'
```

Store the output securely — do not commit it to source control.

## 4. Update the environment variables

In your secrets manager or `.env`:

```env
CHRONICLE_KEY_ID=chronicle-main-v2
CHRONICLE_PRIVATE_KEY=<new private key>
CHRONICLE_PUBLIC_KEY=<new public key>
```

Update `CHRONICLE_KEY_ID` so future artifacts are distinguishable from those signed by the old key.

## 5. Deploy and verify

After deploying:

```bash
# Confirm Chronicle is using the new key
php artisan chronicle:checkpoint

# Verify the chain from the new key forward
php artisan chronicle:verify
```

## Verify it worked

```bash
php artisan chronicle:stats
```

A new checkpoint should appear with the updated `key_id`. Any export produced after this point will carry the new key id in `signature.json`.

## See also

- [Signing & Keys](./signing-and-keys.md) — key format, generation, and the default Ed25519 provider
- [Checkpoints](./checkpoints.md) — what a checkpoint stores
- [Custom Signing Providers](./custom-signing-providers.md) — using KMS or other backends
