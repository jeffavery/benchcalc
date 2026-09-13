# Marking references

Conversion tables were checked against the following references. These are optional reading links, not runtime dependencies. No source artwork was reused.

- Texas Instruments, Analog Engineer's Pocket Reference, resistor color-code table: https://www.ti.com/seclit/eb/slyw038c/slyw038c.pdf
- Vishay resistor color code chart, including missing tolerance band = 20%: https://www.vishay.com/docs/49478/_dale_resistor_color_code_chart_vmn_ms0002_1612.pdf
- Bourns CR series datasheet, numeric and R decimal resistance markings: https://www.bourns.com/docs/product-datasheets/cr.pdf
- Bourns inductor EIA marking examples: https://bourns.com/docs/technical-documents/technical-library/inductive-components/publications/ColorCodeMarkings.pdf
- RS Intek AL series datasheet, page 6, inductor color-code table including black 20% tolerance and yellow multiplier: https://www.rsintek.com/web/userfiles/download/ALSeries.pdf
- Specap engineering capacitor marking guide, including third-digit 8/9 fractional multipliers: https://specap.com/resources/blog/how-to-read-capacitor-markings-codes
- KYOCERA AVX TC series, capacitance expressed as two significant figures plus multiplier in picofarads: https://datasheets.kyocera-avx.com/tc-series.pdf

Supported schemes are described in the app. Manufacturer-specific alternatives require the individual component datasheet. Resistor precision and temperature coefficients, capacitance values, and inductor values are separate from part ratings and availability.

## Circuit design references

- TI NE555 datasheet: standard astable and monostable timing relationships and complete example wiring: https://www.ti.com/lit/ds/symlink/ne555.pdf
- PowerStream copper AWG chart: selected current-guideline values and DC resistance; AWG diameter formula and limitations: https://www.powerstream.com/Wire_Size.htm

Wire-reference values are explicitly qualified in the app. The loop model doubles the entered one-way length and uses tabulated copper DC resistance. It does not model connector resistance, insulation temperature, bundling, or AC skin effect. The other worksheets use the standard ideal DC resistor/capacitor relationships shown next to each result. LED forward-voltage/current inputs must come from the actual device data.
