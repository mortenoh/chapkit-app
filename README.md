# Chapkit Browser

Read-only DHIS2 explorer for CHAP model services ([chapkit](https://github.com/dhis2-chap/chapkit)) via the chap-core route.

It lets a DHIS2 operator inspect the model services registered with chap-core - their model metadata, configurations, jobs, and produced artifacts (including inline dataframe previews) - without leaving DHIS2. It is read-only: it surfaces what chap-core knows, it does not start runs or change anything.

Documentation (with screenshots of every screen): **https://mortenoh.github.io/chapkit-app/**

## How it connects

The app never talks to chap-core directly. It goes through a DHIS2 [Route](https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-master/route.html) with code `chap`, which reverse-proxies to chap-core, which in turn proxies to each chapkit service:

```
DHIS2  /api/routes/chap/run/v2  ->  chap-core /v2  ->  chapkit /api/v1
```

If the route is missing or chap-core is unreachable, the app shows a setup screen explaining what to fix.

## Prerequisites

- A running DHIS2 instance (2.40+) where you have the App Management authority.
- A reachable chap-core with at least one chapkit model service registered.
- A DHIS2 wildcard route with code `chap` pointing at your chap-core, for example:

  ```json
  { "name": "chap", "code": "chap", "url": "http://chap:8000/**" }
  ```

## Development

This project uses [pnpm](https://pnpm.io/) and the [DHIS2 Application Platform](https://platform.dhis2.nu/).

```bash
pnpm install
pnpm start --proxy http://localhost:8080   # point at your DHIS2 instance
```

The app is served at http://localhost:3000. Log in with your DHIS2 credentials.

Other scripts:

- `pnpm build` - build the installable app bundle into `build/bundle/*.zip`.
- `pnpm test` - run the test suite.
- `pnpm lint` / `pnpm format` - lint and format.

## Installing into DHIS2

Download the latest `chapkit-app-<version>.zip` from the [Releases](https://github.com/mortenoh/chapkit-app/releases) page (built and attached automatically on every `v*` tag), then in DHIS2 go to **App Management -> Install from file** and upload it. You can also build the zip yourself with `pnpm build` and `pnpm deploy` to a running instance.

## Documentation

The docs are built with MkDocs Material and deployed to GitHub Pages on every change to `docs/`:

```bash
pip install -r docs/requirements.txt
mkdocs serve   # preview at http://localhost:8000
```
