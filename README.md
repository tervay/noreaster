Download gcloud service account credentials with Sheets API enabled. Put it in an env file:

```sh
TYPE=service_account
PROJECT_ID=
PRIVATE_KEY_ID=
PRIVATE_KEY=""
CLIENT_EMAIL=
CLIENT_ID=
AUTH_URI=https://accounts.google.com/o/oauth2/auth
TOKEN_URI=https://oauth2.googleapis.com/token
AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
CLIENT_X509_CERT_URL=
UNIVERSE_DOMAIN=googleapis.com
```

then

```sh
$ bun i
$ bun run dev
```
