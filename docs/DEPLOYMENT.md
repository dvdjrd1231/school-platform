# Deploying to a Debian VPS

End-to-end setup on a fresh Debian 12 server using Docker Compose. The stack is
three containers:

| Container | Role | Exposed to internet |
|---|---|---|
| `caddy` | TLS termination + reverse proxy | yes — ports 80/443 |
| `app` | the Next.js server | no |
| `mongo` | MongoDB 7 | no |

Only Caddy is reachable from outside. The app and database talk over a private
Docker network, so MongoDB is never exposed to the internet — the single most
common way self-hosted databases get compromised.

---

## 0. Before you start

You need:

- A Debian 12 VPS and its public IP address
- A domain (or subdomain) you control
- **A DNS `A` record pointing your domain at the VPS IP** — set this first;
  certificate issuing in step 7 fails without it

Check the record has propagated from your own machine:

```bash
dig +short school.example.com     # should print your VPS IP
```

---

## 1. Connect and create a non-root user

```bash
ssh root@YOUR_SERVER_IP
```

Working as `root` over SSH is the default on most VPS images and is worth
undoing immediately:

```bash
adduser deploy                 # choose a strong password when prompted
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy   # keep your SSH key
```

Open a **second terminal** and confirm the new user works *before* closing the
root session — otherwise a mistake locks you out:

```bash
ssh deploy@YOUR_SERVER_IP
```

---

## 2. Harden SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Set these (they may already exist — edit rather than duplicate):

```
PermitRootLogin no
PasswordAuthentication no      # only if your SSH key works; otherwise leave yes
```

```bash
sudo systemctl restart ssh
```

> Only set `PasswordAuthentication no` once you've confirmed key-based login
> works. With no key and no password you cannot get back in.

---

## 3. Update the system and set the firewall

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ufw git curl

sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable                # answer "y"
sudo ufw status
```

Port 27017 is deliberately absent — MongoDB stays on the internal network.

---

## 4. Install Docker

Debian's own `docker.io` package lags badly; use Docker's official repository:

```bash
sudo apt install -y ca-certificates
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
                    docker-buildx-plugin docker-compose-plugin
```

Let `deploy` use Docker without `sudo`:

```bash
sudo usermod -aG docker deploy
newgrp docker            # or log out and back in
docker run --rm hello-world
```

---

## 5. Get the code

```bash
cd ~
git clone YOUR_REPOSITORY_URL school-platform
cd school-platform
```

Private repo? Either use a deploy key, or clone over HTTPS with a personal
access token.

---

## 6. Configure secrets

Generate a session secret:

```bash
openssl rand -base64 32
```

Create `.env` **in the project directory** (it is gitignored — never commit it):

```bash
nano .env
```

```dotenv
# Your domain, without protocol. Caddy requests the certificate for this name.
DOMAIN=school.example.com

# No domain yet? Test over plain HTTP against the server's IP instead:
#   DOMAIN=:80
#   APP_URL=http://YOUR_SERVER_IP
# Let's Encrypt cannot issue certificates for bare IP addresses, so HTTPS
# requires a real domain. Switch both lines back once DNS is pointed.

# MongoDB credentials — invent these now; they are created on first start.
MONGO_ROOT_USER=schooladmin
MONGO_ROOT_PASSWORD=<a long random password>

# Paste the value printed by `openssl rand -base64 32`.
AUTH_SECRET=<random 32-byte base64>

# The bootstrap administrator. ADMIN_USER must be an email address — it is
# what you type into the sign-in form. The account is created automatically on
# first sign-in, and these variables remain its source of truth.
ADMIN_USER=admin@school.example.com
ADMIN_PASSWORD=<a strong password>
ADMIN_NAME=Administrator

# Real-time messaging (optional). Without these, messages still send and are
# stored — they just arrive on refresh instead of instantly.
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
# These two are compiled into the browser bundle at BUILD time. If you add them
# later you must rebuild (step 9), not just restart.
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
```

Lock the file down:

```bash
chmod 600 .env
```

---

## 7. Start the stack

```bash
docker compose up -d --build
```

The first build takes several minutes. Watch it come up:

```bash
docker compose ps
docker compose logs -f caddy     # certificate issuing appears here
```

Caddy requests a Let's Encrypt certificate automatically. If it fails, the DNS
record is almost always the cause — see Troubleshooting.

---

## 8. Verify

```bash
curl -s https://YOUR_DOMAIN/api/health
```

A healthy response looks like:

```json
{
  "ready": true,
  "env": { "MONGODB_URI": true, "AUTH_SECRET": true, "ADMIN_USER": true },
  "database": { "connected": true, "name": "school-platform" },
  "problems": []
}
```

`problems` names anything still wrong. Then open `https://YOUR_DOMAIN/signin`
and sign in with `ADMIN_USER` / `ADMIN_PASSWORD` — the admin account is created
on that first sign-in, and you land on `/admin`.

### Optional: demo data

To load sample courses, students, and assignments:

```bash
docker compose exec app node -e "require('./scripts/seed.js')" 2>/dev/null \
  || echo "Use the admin panel to create real data instead."
```

Prefer creating real accounts from **Admin → User Management**; the seed exists
for development.

---

## 9. Updating after a code change

```bash
cd ~/school-platform
git pull
docker compose up -d --build
```

Zero-config rebuild; the database volume is untouched. **Changing any
`NEXT_PUBLIC_*` value requires this rebuild** — those are inlined into the
browser bundle at build time, so a plain restart will not pick them up.

---

## 10. Backups

The database lives in the `mongo-data` Docker volume. Back it up on a schedule:

```bash
mkdir -p ~/backups
docker compose exec -T mongo mongodump \
  --username="$MONGO_ROOT_USER" --password="$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase=admin --archive --gzip \
  > ~/backups/school-$(date +%F).archive.gz
```

Automate it daily at 03:00 (`crontab -e`):

```
0 3 * * * cd /home/deploy/school-platform && docker compose exec -T mongo mongodump --username="$MONGO_ROOT_USER" --password="$MONGO_ROOT_PASSWORD" --authenticationDatabase=admin --archive --gzip > /home/deploy/backups/school-$(date +\%F).archive.gz
```

Restore:

```bash
docker compose exec -T mongo mongorestore \
  --username="$MONGO_ROOT_USER" --password="$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase=admin --archive --gzip --drop < backup.archive.gz
```

A backup that lives only on the same VPS does not protect you from losing the
VPS — copy it off the machine (`scp`, object storage) as well.

---

## Everyday commands

```bash
docker compose ps                # what's running
docker compose logs -f app       # follow app logs
docker compose restart app       # restart just the app
docker compose down              # stop everything (data is kept)
docker compose down -v           # stop AND DELETE the database volume
```

`docker compose down -v` destroys your data. There is no undo.

---

## Troubleshooting

**Certificate won't issue / site not reachable over HTTPS**
Check `docker compose logs caddy`. Usually one of:
- the DNS `A` record doesn't point at this server yet (`dig +short YOUR_DOMAIN`)
- ports 80/443 are blocked — `sudo ufw status`, plus any provider-level firewall
- `DOMAIN` in `.env` doesn't exactly match the DNS name

**Logs repeat `TypeError: Invalid URL` with `input: 'https://'`**
`DOMAIN` is missing or empty in `.env`, so `NEXTAUTH_URL` became the bare
string `https://`. Set `DOMAIN` (a hostname, or `:80` plus
`APP_URL=http://YOUR_SERVER_IP` when testing without a domain) and run
`docker compose up -d`. Compose now refuses to start when a required value is
missing, so this should surface as a clear message rather than a runtime crash.

**`/api/health` shows `"connected": false`**
Look at `docker compose logs mongo`. Usually `MONGO_ROOT_USER` /
`MONGO_ROOT_PASSWORD` were changed *after* the volume was first created — the
credentials are only applied on an empty volume. Either restore the original
values, or wipe and start over with `docker compose down -v` (destroys data).

**Sign-in fails with the right password**
Check `/api/health` shows `ADMIN_USER: true` and `AUTH_SECRET: true`. Remember
`ADMIN_USER` must be an **email address**, and `.env` changes need
`docker compose up -d` to take effect.

**Real-time messaging isn't instant**
Expected when the Pusher variables are empty — messages still save and appear on
refresh. To enable it, fill all six values and **rebuild** (step 9), because the
two `NEXT_PUBLIC_*` ones are baked in at build time.

**Build runs out of memory on a small VPS**
The Next.js build needs roughly 2 GB. On a 1 GB instance, add swap:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```
