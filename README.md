# BenchCalc

A self-contained electronics workbench. Original SVG artwork, plain HTML/CSS/JavaScript, no external fonts, libraries, CDNs, analytics, or build step.

## Use locally

Open `public/index.html` in a modern browser. All calculator functionality works without a server or internet connection. Keep the entire `public` directory together. Theme defaults to the system setting; an explicit preference is saved when browser storage is available.

## First increment

- Responsive shared shell, system/light/dark theme.
- Four-band resistor: colors to resistance, tolerance, and range.
- Resistance to colors with exact two-significant-digit representation, 0.10 Ω through 99 GΩ. Invalid values leave the last valid result intact and show an error. The chosen tolerance is preserved.
- Accessible native inputs and color names; original SVG resistor updates with selections.

## Project structure

`public/app.js` owns DOM interactions, `public/theme.js` owns theme initialization, and `public/styles.css` owns the shared shell. Pure calculator logic lives in `public/calculators/resistor.js`, independent of the UI. New calculators should follow this split, reuse the shared controls/results styling, and supply tests of their conversion logic. Classic local scripts intentionally allow direct `file://` use.

Planned: 3/5/6-band resistors, 3/4-digit SMD resistors, ceramic/film/tantalum 3-digit capacitor codes, and 4-band inductors. EIA-96 is outside scope.

## Test

With Node.js installed (development only): `node --test tests/resistor.test.cjs`.
Tests cover known examples, boundary values, invalid inputs, and all 8,640 supported value/tolerance combinations.

## ShopDocker

Repository name: `benchcalc`. Host directory: `/opt/docker/benchcalc`. Target URL: `https://electronics.jeffavery.com`.

Run `docker compose up -d --build` from the project directory. The container joins the existing external `proxy` network and publishes no host port. Configure the hostname through Caddy Manager with upstream `http://benchcalc:80`, following the lab's existing access and certificate conventions.

Only the static `public` files are served. Docker needs an image download for the initial build; the web app itself has no external runtime dependencies. For fully offline storage, keep the static folder as well as a saved container image if Docker recovery without internet is required.

Initial deployment rollback: `docker compose down` from this directory stops only BenchCalc. Remove its newly added host entry through Caddy Manager if routing has been configured. For subsequent releases, record the current Git commit and retain its built image before rebuilding.

The lab reference documents recursive `/opt/docker` backups. Confirm the installed backup script's scope and a subsequent archive before claiming an actual BenchCalc backup. No app database or writable persistent volume is needed.
