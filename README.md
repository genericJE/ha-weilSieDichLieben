<p align="center">
  <img src="images/logo.png" alt="weilSieDichLieben" width="160" />
</p>

# ha-weilSieDichLieben

A Home Assistant dashboard card that embeds the [weilSieDichLieben](https://github.com/genericJE/weilSieDichLieben) BVG departure board, distributed via [HACS](https://hacs.xyz/).

![Preview of the BVG departure board card showing live departures from Alexanderplatz](images/preview.png)

## Architecture

The card is a [LitElement](https://lit.dev/) custom element that mounts the upstream React components as a web component via [`@r2wc/react-to-web-component`](https://github.com/bitovi/react-to-web-component). The upstream React source lives in this repo as a git submodule at [`weilSieDichLieben/`](weilSieDichLieben/) and is consumed at build time by Rollup.

```
ha-weilSieDichLieben/
├── hacs.json                          # HACS manifest
├── info.md                            # shown in the HACS UI
├── src/
│   ├── card.ts                        # <weil-sie-dich-lieben-card> (LitElement shell)
│   ├── react-bridge.tsx               # mounts the React DepartureDisplay via r2wc
│   ├── editor.ts                      # visual config editor (Lit)
│   └── types.ts                       # CardConfig + Station schema
├── dist/
│   └── weil-sie-dich-lieben-card.js   # built artifact, committed for HACS
└── weilSieDichLieben/                 # upstream React app (git submodule)
```

## Development

```bash
git clone --recurse-submodules https://github.com/genericJE/ha-weilSieDichLieben.git
cd ha-weilSieDichLieben
npm install
npm run build         # one-shot build → dist/
npm run watch         # rebuild on change
```

If you forgot `--recurse-submodules` on clone:

```bash
git submodule update --init --recursive
```

## Installation

This card is in the [HACS](https://hacs.xyz/) default store — no custom repository needed:

1. Open HACS and search for **weilSieDichLieben Card**
2. Download it, then reload your browser when prompted
3. Add the card to a dashboard — the visual editor lets you search for BVG stations and toggle transport modes

Or jump straight to it:

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=genericJE&repository=ha-weilSieDichLieben&category=plugin)

For kiosk-style fullscreen rendering, set the view to `panel: true`.

## Configuration

Use the visual editor (Card edit → Show visual editor) for stations and global settings, or edit YAML directly. Each station follows the upstream schema:

```yaml
type: custom:weil-sie-dich-lieben-card
stations:
  - id: "900100003"           # BVG station id
    value: "S+U Alexanderplatz"
    suburban: true            # S-Bahn
    subway: true              # U-Bahn
    tram: true
    bus: true
    ferry: false
    express: false
    regional: false
    when: 0                   # min minutes until departure
    results: 6                # number of departures to show
```

## License

MIT — see [LICENSE](LICENSE). Derived from [weilSieDichLieben](https://github.com/NikBLN/weilSieDichLieben) by Nikolas Tsombanis.

If anything here ends up being useful to you and you feel like saying thanks, my PayPal is https://paypal.me/genericJE. Truly no expectation either way, just leaving the option here in case.
