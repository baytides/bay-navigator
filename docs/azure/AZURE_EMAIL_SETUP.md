# Azure Communication Services Email — Domain Setup

This guide covers creating the Email Service, adding your custom domain, DNS records, verification, and sender username for baynavigator.org.

## Prerequisites

- Azure subscription: 7848d90a-1826-43f6-a54e-090c2d18946f
- Resource group: baynavigator-rg
- Communication Services resource: baynavigator-comm (Global, UnitedStates)
- DNS access for baynavigator.org
- Azure CLI with `communication` extension (`az extension add -n communication`)

## Create Email Service

```bash
az communication email create \
  -n baynavigator-email \
  -g baynavigator-rg \
  --location global \
  --data-location unitedstates
```

## Add Domain (Customer Managed)

```bash
az communication email domain create \
  -n baynavigator.org \
  --email-service-name baynavigator-email \
  -g baynavigator-rg \
  --location global \
  --domain-management CustomerManaged
```

## DNS Records to Add

Create the following records in your DNS provider for baynavigator.org (TTL ~3600):

- TXT: baynavigator.org → "ms-domain-verification=d2aab390-0957-402c-99cb-2927bb8405e7"
- TXT: baynavigator.org → "v=spf1 include:spf.protection.outlook.com -all"
- CNAME: selector1-azurecomm-prod-net.\_domainkey → selector1-azurecomm-prod-net.\_domainkey.azurecomm.net
- CNAME: selector2-azurecomm-prod-net.\_domainkey → selector2-azurecomm-prod-net.\_domainkey.azurecomm.net

Optional but recommended:

- TXT: \_dmarc → "v=DMARC1; p=none; rua=mailto:postmaster@baynavigator.org" (tighten policy later)

## Verify DNS

Once records propagate, initiate verification for each record type:

```bash
az communication email domain initiate-verification \
  --domain-name baynavigator.org \
  --email-service-name baynavigator-email \
  -g baynavigator-rg \
  --verification-type Domain

az communication email domain initiate-verification \
  --domain-name baynavigator.org \
  --email-service-name baynavigator-email \
  -g baynavigator-rg \
  --verification-type SPF

az communication email domain initiate-verification \
  --domain-name baynavigator.org \
  --email-service-name baynavigator-email \
  -g baynavigator-rg \
  --verification-type DKIM

az communication email domain initiate-verification \
  --domain-name baynavigator.org \
  --email-service-name baynavigator-email \
  -g baynavigator-rg \
  --verification-type DKIM2
```

Check status:

```bash
az communication email domain show \
  -n baynavigator.org \
  --email-service-name baynavigator-email \
  -g baynavigator-rg -o json | jq .verificationStates
```

## Create Sender Usernames

Sender must match the local-part of the email address. Existing senders:

- `donotreply` (default for site services)
- `info` (for branded replies if needed)

Create additional senders as needed:

```bash
az communication email domain sender-username create \
  --domain-name baynavigator.org \
  --email-service-name baynavigator-email \
  -g baynavigator-rg \
  --sender-username donotreply \
  --username donotreply \
  --display-name "Bay Navigator"
```

## Configure Function App (already set)

- ACS connection string: ACS_CONNECTION_STRING (baynavigator-comm)
- Sender address: ACS_SENDER_ADDRESS=donotreply@baynavigator.org (defaults to this if unset)

## Test Sending

Use the `/send-email` Azure Function via APIM with your subscription key. If DMARC/SPF/DKIM aren’t verified, delivery may be restricted.

## Notes

- Keep domain management as CustomerManaged for full DNS control.
- Tighten DMARC policy (`p=quarantine` or `p=reject`) after confirming deliverability.
- For multiple senders, repeat the sender-username step for each local-part (e.g., `support`, `noreply`).
