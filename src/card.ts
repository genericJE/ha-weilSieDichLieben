import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './react-bridge';
import type { CardConfig } from './types';

const CARD_VERSION = '1.0.0';

console.info(
  `%c WEIL-SIE-DICH-LIEBEN-CARD %c v${CARD_VERSION} `,
  'color: white; background: #f0d722; font-weight: 700;',
  'color: #f0d722; background: #222; font-weight: 700;',
);

interface CustomCardEntry {
  type: string;
  name: string;
  description: string;
  preview?: boolean;
  documentationURL?: string;
}

const w = window as unknown as { customCards?: CustomCardEntry[] };
w.customCards = w.customCards ?? [];
w.customCards.push({
  type: 'weil-sie-dich-lieben-card',
  name: 'weilSieDichLieben',
  description: 'BVG departure board for Home Assistant',
  preview: true,
  documentationURL: 'https://github.com/genericJE/ha-weilSieDichLieben',
});

@customElement('weil-sie-dich-lieben-card')
export class WeilSieDichLiebenCard extends LitElement {
  @property({ attribute: false }) public hass?: unknown;
  @state() private _config?: CardConfig;

  public static async getConfigElement(): Promise<HTMLElement> {
    await import('./editor');
    return document.createElement('weil-sie-dich-lieben-editor');
  }

  public static getStubConfig(): CardConfig {
    // Stub config used by the dashboard "Add card" picker to render a live
    // preview, and as the initial config when a user adds the card. Defaults
    // to S+U Alexanderplatz so the picker shows real BVG data instead of an
    // empty placeholder; users can change this via the visual editor. Tuned
    // for the picker thumbnail (smaller font, fewer rows so they all fit).
    return {
      type: 'custom:weil-sie-dich-lieben-card',
      stations: [
        {
          id: '900100003',
          value: 'S+U Alexanderplatz',
          suburban: true,
          subway: true,
          tram: true,
          bus: true,
          when: 0,
          results: 4,
        },
      ],
      fontSize: 12,
    };
  }

  public setConfig(config: CardConfig): void {
    if (!config) {
      throw new Error('Invalid configuration');
    }
    this._config = config;
  }

  public getCardSize(): number {
    return 6;
  }

  protected render(): TemplateResult {
    if (!this._config) return html``;

    const stations = this._config.stations ?? [];
    if (stations.length === 0) {
      return html`
        <ha-card>
          <div class="empty">
            No stations configured. Add a <code>stations</code> list to the card config.
          </div>
        </ha-card>
      `;
    }

    return html`
      <ha-card>
        <weil-sie-dich-lieben-departure-display
          .selectedStations=${stations}
          .fontSize=${this._config.fontSize ?? 16}
          .language=${this._config.language ?? 'de'}
          .remarksVisibility=${this._config.remarksVisibility ?? true}
          .standardRemarksVisibility=${this._config.standardRemarksVisibility ?? true}
          .hideDepartureCol=${this._config.hideDepartureCol ?? false}
        ></weil-sie-dich-lieben-departure-display>
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    .empty {
      padding: 24px;
      text-align: center;
      color: var(--secondary-text-color);
    }
    code {
      background: var(--code-editor-background-color, rgba(255, 255, 255, 0.05));
      padding: 0 4px;
      border-radius: 3px;
    }
    weil-sie-dich-lieben-departure-display {
      display: block;
      background: black;
      min-height: 200px;
      /* Match ha-card's rounded corners so the black background follows the
         card outline in masonry/sections views. In panel mode HA sets the
         variable to 0, so the card stays edge-to-edge. */
      border-radius: var(--ha-card-border-radius, 12px);
      overflow: hidden;
    }
  `;
}
