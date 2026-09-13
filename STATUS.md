# First increment — 2026-09-12

## Confirmed

- Created private repository https://github.com/jeffavery/benchcalc and pushed main.
- Installed at `/opt/docker/benchcalc`; `benchcalc` container is healthy on the existing `proxy` network.
- Caddy successfully fetched `http://benchcalc:80/`.
- Four test groups pass, including 8,640 value/tolerance round trips.
- Browser checks passed for colors-to-value, value-to-colors, invalid-value rejection, and saved dark theme on reload. Light desktop and dark mobile layouts visually inspected.
- Corrected the original SVG lead gradient after visual inspection.

## Next checkpoint

- Add `electronics.jeffavery.com` through Caddy Manager, upstream `http://benchcalc:80`, using existing lab certificate/access conventions. No Caddy configuration was changed. The browser could not open Caddy Manager (`ERR_BLOCKED_BY_CLIENT`). DNS and HTTPS for the new hostname remain unverified.
- The backup timer is active. `/opt/docker/HOME-LAB.md` documents recursive `/opt/docker` coverage, but direct inspection of the installed script requires sudo authentication. Verify BenchCalc members in the next completed archive; no backup configuration was changed.
- Add the remaining calculators incrementally using the pure-logic/shared-shell structure.
