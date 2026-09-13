# BenchCalc

A self-contained electronics workbench with original SVG artwork and plain HTML, CSS, and JavaScript. No external fonts, libraries, CDNs, analytics, or build step.

## Use locally

Open `public/index.html` in a modern browser, or serve the `public` directory with any static web server. Keep that entire directory together. Calculator scripts load from local files; external links in the reading guides are optional references. Theme follows the system by default, with light/dark overrides saved when browser storage is available.

## Circuit tools

The local version adds these tools in Jeffrey's preference order:

1. LED resistor: series LED count, upward E24 selection, nominal current, dissipation, and 2× power-rating margin.
2. 555 timer: standard astable frequency/duty/high/low/period and monostable pulse duration.
3. Copper wire gauge/current reference: selected even AWG sizes 10–30, two-conductor DC voltage drop, loss, and explicitly qualified current guidelines.
4. Ohm's law: all six pairs of known positive voltage, current, resistance, and power.
5. Voltage divider: unloaded output or an optional parallel load, with current and resistor dissipation.
6. Current divider: two parallel branches, equivalent resistance, voltage, current, and power.
7. Series/parallel resistors: 2–20 values in a common selectable unit.
8. Series/parallel capacitors: 2–20 values in a common selectable unit.

These worksheets show approximate nominal results and their assumptions. The 555 graphic is a timing model, not a complete wiring schematic. Wire current figures are guidelines, not code-rated ampacities. Results update on Calculate; mode changes recalculate automatically. Invalid circuit inputs hide the result until corrected. Inputs are retained while switching tools in the same page.

Pure circuit logic lives in `public/calculators/circuits.js`; worksheet definitions, original SVG concepts, and the shared form renderer live in `public/design-ui.js`.

## Component-code calculator library

- 3-, 4-, 5-, and 6-band resistors: colors to resistance and resistance to colors, tolerance ranges, and sixth-band temperature coefficient.
- 3- and 4-digit SMD resistors: numeric codes, R decimal codes, and zero-ohm jumpers in both directions.
- 3-digit capacitor codes: code/value conversion in pF, nF, and µF, including multiplier digits 8 and 9. Original ceramic, film, and tantalum illustrations share the same calculation.
- 4-band EIA inductors: colors/value conversion in µH, mH, and H. Supported multiplier colors are silver, gold, black, brown, red, orange, and yellow; tolerances are gold 5%, silver 10%, and black 20%.

The calculator library works on desktop and mobile. Valid values are retained separately for each tool while switching within the page; reloading returns to that tool's example. Each tool has an example reset and reading guide. Banded tools also have a color reference table. Invalid inputs preserve the last valid result and show an error. Reverse conversions never intentionally round an unrepresentable value.

EIA-96, military inductor codes, and manufacturer-specific marking systems are outside scope. Printed capacitance/resistance values do not establish voltage, power, current rating, or tolerance; separate markings and datasheets provide these.

## Structure

- `public/app.js`: navigation, per-tool state, shared controls, and result presentation.
- `public/calculators/resistor.js`: pure resistor conversions and color tables.
- `public/calculators/codes.js`: pure SMD and capacitor code conversions.
- `public/calculators/inductor.js`: pure EIA inductor conversions.
- `public/graphics.js`: original component SVG drawings.
- `public/styles.css` and `public/theme.js`: shared layout and appearance.

Classic local scripts intentionally support direct file use. New calculators should keep conversion logic independent from the UI and reuse the shared shell.

## Test

With Node.js installed for development only:

`node --test tests/*.test.cjs`

Twenty-one test groups cover known manufacturer examples, value boundaries, rejected inputs, supported temperature coefficients, and exhaustive supported magnitude round trips. Browser checks also cover all eight modes, forward/reverse interactions, errors, retained state, theme persistence, and responsive layouts. See `STATUS.md` for verification limits.

## Unit converter

Capacitance (pF/nF/µF/F), resistance (Ω/kΩ/MΩ), and frequency/period (Hz/kHz/MHz and s/ms/µs). The 555 calculator also supports resistors from target timing.

## Deployment

ShopDocker path: `/opt/docker/benchcalc`. GitHub: `jeffavery/benchcalc`. The Docker service joins `proxy` with no host port. Caddy Manager upstream: `http://benchcalc:80`. Target hostname: `electronics.jeffavery.com`; routing still pending.

Backup scope includes `/opt/docker` recursively; archive inclusion is not yet verified. Previous image preserved as `benchcalc-rollback:b74993e`.
