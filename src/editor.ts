import { LitElement, html, css, type TemplateResult, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { CardConfig, Station } from './types';

interface BvgLocation {
  type: string;
  id: string;
  name: string;
}

@customElement('weil-sie-dich-lieben-editor')
export class WeilSieDichLiebenEditor extends LitElement {
  @property({ attribute: false }) public hass?: unknown;
  @state() private _config?: CardConfig;
  @state() private _searchQuery = '';
  @state() private _searchResults: BvgLocation[] = [];
  @state() private _searchPending = false;

  private _searchTimer?: number;

  public setConfig(config: CardConfig): void {
    this._config = config;
  }

  private _emit(updated: CardConfig): void {
    this._config = updated;
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: updated },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _addStation(loc: BvgLocation): void {
    if (!this._config) return;
    const next: Station = {
      id: loc.id,
      value: loc.name,
      suburban: true,
      subway: true,
      tram: true,
      bus: true,
      ferry: false,
      express: false,
      regional: false,
      when: 0,
      results: 6,
    };
    const stations = [...(this._config.stations ?? []), next];
    this._emit({ ...this._config, stations });
    this._searchQuery = '';
    this._searchResults = [];
  }

  private _removeStation(idx: number): void {
    if (!this._config) return;
    const stations = (this._config.stations ?? []).filter((_, i) => i !== idx);
    this._emit({ ...this._config, stations });
  }

  private _updateStation<K extends keyof Station>(idx: number, key: K, value: Station[K]): void {
    if (!this._config) return;
    const stations = (this._config.stations ?? []).map((s, i) =>
      i === idx ? { ...s, [key]: value } : s,
    );
    this._emit({ ...this._config, stations });
  }

  private _updateGlobal<K extends keyof CardConfig>(key: K, value: CardConfig[K]): void {
    if (!this._config) return;
    this._emit({ ...this._config, [key]: value });
  }

  private _onSearchInput(e: Event): void {
    const q = (e.target as HTMLInputElement).value;
    this._searchQuery = q;
    if (this._searchTimer) clearTimeout(this._searchTimer);
    if (!q.trim()) {
      this._searchResults = [];
      return;
    }
    this._searchPending = true;
    this._searchTimer = window.setTimeout(() => this._fetchStations(q), 300);
  }

  private async _fetchStations(query: string): Promise<void> {
    try {
      const url = `https://v6.bvg.transport.rest/locations?query=${encodeURIComponent(query)}&results=10&stops=true&addresses=false&poi=false`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = (await res.json()) as BvgLocation[];
      if (this._searchQuery !== query) return;
      this._searchResults = (data ?? []).filter((d) => d.type === 'stop');
    } catch (err) {
      console.error('[weilSieDichLieben editor] BVG search failed:', err);
    } finally {
      this._searchPending = false;
    }
  }

  protected render(): TemplateResult {
    if (!this._config) return html``;
    const stations = this._config.stations ?? [];

    return html`
      <div class="root">
        <section>
          <h3>Stations <span class="count">(${stations.length})</span></h3>
          ${stations.map((s, i) => this._renderStation(s, i))}
          ${this._renderStationSearch()}
        </section>

        <section>
          <h3>General</h3>
          <div class="globals">
            ${this._renderToggle('Show remarks', 'remarksVisibility', true)}
            ${this._renderToggle('Show standard remarks', 'standardRemarksVisibility', true)}
            ${this._renderToggle('Hide "Abfahrt von" column', 'hideDepartureCol', false)}
            ${this._renderToggle('Hide vehicle radar', 'hideRadar', false)}
            ${this._renderNumber('Font size (px)', 'fontSize', 16, 8, 48, 1)}
            ${this._renderSelect('Language', 'language', 'de', [
              { value: 'de', label: 'Deutsch' },
              { value: 'en', label: 'English' },
            ])}
          </div>
        </section>
      </div>
    `;
  }

  private _renderStation(station: Station, idx: number): TemplateResult {
    return html`
      <div class="station">
        <header>
          <span class="name">${station.value || `Station ${idx + 1}`}</span>
          <span class="id">${station.id}</span>
          <button class="remove" title="Remove" @click=${() => this._removeStation(idx)}>✕</button>
        </header>
        <div class="modes">
          ${this._renderMode(idx, station, 'suburban', 'S-Bahn')}
          ${this._renderMode(idx, station, 'subway', 'U-Bahn')}
          ${this._renderMode(idx, station, 'tram', 'Tram')}
          ${this._renderMode(idx, station, 'bus', 'Bus')}
          ${this._renderMode(idx, station, 'ferry', 'Ferry')}
          ${this._renderMode(idx, station, 'express', 'IC/ICE')}
          ${this._renderMode(idx, station, 'regional', 'RB/RE')}
        </div>
        <div class="numbers">
          <label>
            <span>Departures shown</span>
            <input
              type="number"
              min="1"
              max="20"
              .value=${String(station.results ?? 6)}
              @change=${(e: Event) =>
                this._updateStation(idx, 'results', Number((e.target as HTMLInputElement).value))}
            />
          </label>
          <label>
            <span>Min minutes ahead</span>
            <input
              type="number"
              min="0"
              max="60"
              .value=${String(station.when ?? 0)}
              @change=${(e: Event) =>
                this._updateStation(idx, 'when', Number((e.target as HTMLInputElement).value))}
            />
          </label>
        </div>
      </div>
    `;
  }

  private _renderMode(idx: number, station: Station, key: keyof Station, label: string): TemplateResult {
    return html`
      <label class="mode">
        <input
          type="checkbox"
          .checked=${(station[key] as boolean) ?? false}
          @change=${(e: Event) =>
            this._updateStation(idx, key, (e.target as HTMLInputElement).checked as Station[typeof key])}
        />
        <span>${label}</span>
      </label>
    `;
  }

  private _renderStationSearch(): TemplateResult {
    return html`
      <div class="search">
        <input
          type="text"
          placeholder="Search BVG stations to add…"
          .value=${this._searchQuery}
          @input=${this._onSearchInput}
        />
        ${this._searchPending ? html`<span class="hint">Searching…</span>` : nothing}
        ${this._searchResults.length > 0
          ? html`
              <ul class="results">
                ${this._searchResults.map(
                  (r) => html`
                    <li>
                      <button @click=${() => this._addStation(r)}>
                        <span class="name">${r.name}</span>
                        <span class="id">${r.id}</span>
                      </button>
                    </li>
                  `,
                )}
              </ul>
            `
          : nothing}
      </div>
    `;
  }

  private _renderToggle(label: string, key: keyof CardConfig, fallback: boolean): TemplateResult {
    const value = (this._config?.[key] as boolean) ?? fallback;
    return html`
      <label class="row">
        <span>${label}</span>
        <input
          type="checkbox"
          .checked=${value}
          @change=${(e: Event) =>
            this._updateGlobal(key, (e.target as HTMLInputElement).checked as CardConfig[typeof key])}
        />
      </label>
    `;
  }

  private _renderNumber(
    label: string,
    key: keyof CardConfig,
    fallback: number,
    min: number,
    max: number,
    step: number,
  ): TemplateResult {
    const value = (this._config?.[key] as number) ?? fallback;
    return html`
      <label class="row">
        <span>${label}</span>
        <input
          type="number"
          min=${min}
          max=${max}
          step=${step}
          .value=${String(value)}
          @change=${(e: Event) =>
            this._updateGlobal(key, Number((e.target as HTMLInputElement).value) as CardConfig[typeof key])}
        />
      </label>
    `;
  }

  private _renderSelect(
    label: string,
    key: keyof CardConfig,
    fallback: string,
    options: Array<{ value: string; label: string }>,
  ): TemplateResult {
    const value = (this._config?.[key] as string) ?? fallback;
    return html`
      <label class="row">
        <span>${label}</span>
        <select
          .value=${value}
          @change=${(e: Event) =>
            this._updateGlobal(key, (e.target as HTMLSelectElement).value as CardConfig[typeof key])}
        >
          ${options.map(
            (o) => html`<option value=${o.value} ?selected=${o.value === value}>${o.label}</option>`,
          )}
        </select>
      </label>
    `;
  }

  static styles = css`
    :host {
      display: block;
      padding: 12px;
      color: var(--primary-text-color);
      font-family: var(--ha-font-family, var(--paper-font-body1_-_font-family));
    }
    section {
      margin-bottom: 20px;
    }
    h3 {
      margin: 0 0 8px 0;
      font-size: 1em;
      font-weight: 600;
    }
    .count {
      color: var(--secondary-text-color);
      font-weight: 400;
    }
    .station {
      border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
      background: var(--secondary-background-color, transparent);
    }
    .station header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .station header .name {
      font-weight: 600;
    }
    .station header .id {
      color: var(--secondary-text-color);
      font-size: 0.85em;
      flex: 1;
    }
    .remove {
      background: none;
      border: none;
      color: var(--error-color, #c62828);
      cursor: pointer;
      font-size: 1.1em;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .remove:hover {
      background: var(--secondary-background-color, rgba(127, 127, 127, 0.1));
    }
    .modes {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 4px 12px;
      margin-bottom: 10px;
    }
    .mode {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      font-size: 0.95em;
    }
    .numbers {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .numbers label {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .numbers input {
      width: 90px;
    }
    .search {
      position: relative;
      margin-top: 8px;
    }
    .search > input {
      width: 100%;
      padding: 8px 10px;
      box-sizing: border-box;
    }
    .hint {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--secondary-text-color);
      font-size: 0.85em;
      pointer-events: none;
    }
    .results {
      list-style: none;
      margin: 4px 0 0 0;
      padding: 0;
      max-height: 240px;
      overflow-y: auto;
      border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
      border-radius: 6px;
      background: var(--card-background-color, var(--ha-card-background));
    }
    .results li {
      border-bottom: 1px solid var(--divider-color, rgba(127, 127, 127, 0.2));
    }
    .results li:last-child {
      border-bottom: none;
    }
    .results button {
      display: flex;
      width: 100%;
      justify-content: space-between;
      align-items: baseline;
      padding: 8px 10px;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      color: var(--primary-text-color);
      font-size: 0.95em;
    }
    .results button:hover {
      background: var(--secondary-background-color, rgba(127, 127, 127, 0.1));
    }
    .results .id {
      color: var(--secondary-text-color);
      font-size: 0.8em;
      font-family: var(--code-font-family, monospace);
    }
    .globals {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 32px;
    }
    .row > span {
      flex: 1;
    }
    input[type='checkbox'] {
      width: 18px;
      height: 18px;
      accent-color: var(--primary-color, #f0d722);
    }
    input[type='number'],
    input[type='text'],
    select {
      background: var(--card-background-color, var(--ha-card-background));
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 0.95em;
      font-family: inherit;
    }
    input:focus,
    select:focus {
      outline: 2px solid var(--primary-color, #f0d722);
      outline-offset: -1px;
    }
  `;
}
