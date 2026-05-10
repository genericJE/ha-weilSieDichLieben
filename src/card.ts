import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { CardConfig } from './types';

const CARD_VERSION = '0.1.0';

console.info(
  `%c WEIL-SIE-DICH-LIEBEN-CARD %c v${CARD_VERSION} `,
  'color: white; background: #f0d722; font-weight: 700;',
  'color: #f0d722; background: #222; font-weight: 700;',
);

interface CustomCardEntry {
  type: string;
  name: string;
  description: string;
}

const w = window as unknown as { customCards?: CustomCardEntry[] };
w.customCards = w.customCards ?? [];
w.customCards.push({
  type: 'weil-sie-dich-lieben-card',
  name: 'weilSieDichLieben',
  description: 'BVG departure board for Home Assistant',
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
    return { type: 'custom:weil-sie-dich-lieben-card', stations: [] };
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
    if (!this._config) {
      return html``;
    }
    const stationCount = this._config.stations?.length ?? 0;
    return html`
      <ha-card>
        <div class="placeholder">
          <div class="title">weilSieDichLieben</div>
          <div class="hint">
            Bridge not yet wired. ${stationCount} station${stationCount === 1 ? '' : 's'} configured.
          </div>
        </div>
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    .placeholder {
      padding: 24px;
      text-align: center;
      color: var(--secondary-text-color);
    }
    .title {
      font-size: 1.2em;
      color: var(--primary-text-color);
      margin-bottom: 8px;
    }
    .hint {
      font-size: 0.9em;
    }
  `;
}
