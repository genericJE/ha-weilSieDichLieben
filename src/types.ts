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
}
