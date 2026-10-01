# Tor onion service

This image publishes Bay Navigator at its `.onion` address. Tor receives
requests from the Tor network and hands them to nginx, which proxies them to
`https://baynavigator.org`. The service needs no inbound ports.

It runs as a Docker container on the `baytides-proxy` VM in the
`baytides-proxies-rg` resource group.

## Keys

The `/opt/tor-proxy/keys` directory on the VM holds two files:

- `tor_auth_secret` is sent to Cloudflare in the `X-Tor-Auth` header. A custom
  WAF rule on baynavigator.org uses it to skip the bot challenge for this
  traffic. Without it, every visitor sees a challenge page.
- `hs_ed25519_secret_key` defines the onion address.

The address `ik2rhhyr6f2dk2th7ofa7yph6li5tuwycqflzrkuu37ht7apbih3ypid.onion` is
derived from the key at `/opt/tor-proxy/keys/hs_ed25519_secret_key` on the VM.
If the key is lost, the address is lost with it. Keep a backup somewhere safe.

## Deploying a change

Copy `Dockerfile` and `entrypoint.sh` to `/opt/tor-proxy/` on the VM, then run:

```bash
cd /opt/tor-proxy
sudo docker build -t tor-proxy .
sudo docker rm -f tor-proxy
sudo docker run -d --name tor-proxy --restart unless-stopped \
  -v /opt/tor-proxy/keys:/keys:ro tor-proxy
```

Check that the service published its address with
`sudo docker logs tor-proxy 2>&1 | grep -i "onion\|bootstrapped"`.
