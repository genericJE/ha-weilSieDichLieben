export interface Station {
  id: string;
  value: string;
  suburban?: boolean;
  subway?: boolean;
  tram?: boolean;
  bus?: boolean;
  ferry?: boolean;
  express?: boolean;
  regional?: boolean;
  when?: number;
  results?: number;
  destination?: { id: string; name: string };
}

export interface CardConfig {
  type: 'custom:weil-sie-dich-lieben-card';
  stations: Station[];
  language?: 'de' | 'en';
  fontSize?: number;
  remarksVisibility?: boolean;
  standardRemarksVisibility?: boolean;
  autoHide?: boolean;
  hideDepartureCol?: boolean;
  hideRadar?: boolean;
  // auto: compact table below the upstream breakpoint of card width.
  layout?: 'auto' | 'wide' | 'compact';
}

// The slice of HA's hass object the card touches.
export interface HassConnection {
  sendMessagePromise<T>(message: { type: string } & Record<string, unknown>): Promise<T>;
  addEventListener(type: 'ready', listener: () => void): void;
  removeEventListener(type: 'ready', listener: () => void): void;
}

export interface HomeAssistantLike {
  connection: HassConnection;
  auth?: { data?: { hassUrl?: string } };
}

// Mirrors LovelaceGridOptions in the HA frontend (sections view sizing).
export interface GridOptions {
  columns?: number | 'full';
  rows?: number | 'auto';
  min_columns?: number;
  max_columns?: number;
  min_rows?: number;
  max_rows?: number;
}
