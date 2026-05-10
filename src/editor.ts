import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { CardConfig } from './types';

@customElement('weil-sie-dich-lieben-editor')
export class WeilSieDichLiebenEditor extends LitElement {
  public hass?: unknown;
  @state() private _config?: CardConfig;

  public setConfig(config: CardConfig): void {
    this._config = config;
  }

  protected render(): TemplateResult {
    if (!this._config) {
      return html``;
    }
    return html`
      <div class="placeholder">
        Visual editor not yet implemented. Edit the card YAML directly for now.
      </div>
    `;
  }

  static styles = css`
    .placeholder {
      padding: 16px;
      color: var(--secondary-text-color);
    }
  `;
}
