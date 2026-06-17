# Chapkit Browser

Read-only DHIS2 explorer for CHAP model services ([chapkit](https://github.com/dhis2-chap/chapkit)) via the chap-core route.

The app lets a DHIS2 operator inspect the model services registered with chap-core - their model metadata, configurations, jobs, and produced artifacts - without leaving DHIS2. It is read-only: it surfaces what chap-core knows, it does not start runs or change anything.

## How it connects

The app never talks to chap-core directly. It goes through a DHIS2 [Route](https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-master/route.html) with code `chap`, which reverse-proxies to chap-core, which in turn proxies to each chapkit service:

```
DHIS2  /api/routes/chap/run/v2  ->  chap-core /v2  ->  chapkit /api/v1
```

## Prerequisites

- A running DHIS2 instance where you have the App Management authority.
- A DHIS2 wildcard route with code `chap` that forwards to your chap-core server, for example:

    ```json
    { "name": "chap", "code": "chap", "url": "http://chap:8000/**" }
    ```

- A reachable chap-core with at least one chapkit model service registered. If the route is missing or chap-core is unreachable, the app shows a setup screen explaining what to fix.

## Running locally

```bash
pnpm install
pnpm start --proxy http://localhost:8090   # point at your DHIS2 instance
```

The app is served at http://localhost:3000. Log in with your DHIS2 credentials.

See [Screens](screens.md) for a walkthrough of every page.
