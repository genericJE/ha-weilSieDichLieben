<p align="center">
  <img src="images/logo.png" alt="weilSieDichLieben" width="160" />
</p>

# ha-weilSieDichLieben

A Home Assistant Lovelace card that embeds the [weilSieDichLieben](https://github.com/genericJE/weilSieDichLieben) BVG departure board, distributed via [HACS](https://hacs.xyz/).

## Architecture

The card is a [LitElement](https://lit.dev/) custom element that mounts the upstream React components as a web component via [`@r2wc/react-to-web-component`](https://github.com/bitovi/react-to-web-component). The upstream React source lives in this repo as a git submodule at [`weilSieDichLieben/`](weilSieDichLieben/) and is consumed at build time by Rollup.

```
ha-weilSieDichLieben/
├── hacs.json                          # HACS plugin manifest
├── info.md                            # shown in the HACS UI
├── src/
│   ├── card.ts                        # <weil-sie-dich-lieben-card> (LitElement shell)
│   ├── editor.ts                      # Lovelace config editor (stub)
│   └── types.ts                       # CardConfig + Station schema
├── dist/
│   └── weil-sie-dich-lieben-card.js   # built artifact, committed for HACS
└── weilSieDichLieben/                 # upstream React app (git submodule)
```

## Development

```bash
git clone --recurse-submodules git@github-personal:genericJE/ha-weilSieDichLieben.git
cd ha-weilSieDichLieben
npm install
npm run build         # one-shot build → dist/
npm run watch         # rebuild on change
```

If you forgot `--recurse-submodules` on clone:

```bash
git submodule update --init --recursive
```

## Installation (for end users)

This repo is not yet published to HACS default. To install via custom repository:

1. In Home Assistant, open HACS → Frontend → ⋯ → Custom repositories
2. Add `https://github.com/genericJE/ha-weilSieDichLieben` as type `Lovelace`
3. Install **weilSieDichLieben Card**
4. Add a card to a dashboard with `type: custom:weil-sie-dich-lieben-card`

## Configuration

Each station in the `stations` array follows the upstream schema:

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
