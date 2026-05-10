declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.css';

declare module '../weilSieDichLieben/src/Components/DepartureDisplay' {
  import type { ComponentType } from 'react';
  const DepartureDisplay: ComponentType<{
    selectedStations: unknown[];
    fontSize?: number;
    language?: string;
    remarksVisibility?: boolean;
    standardRemarksVisibility?: boolean;
    hideDepartureCol?: boolean;
  }>;
  export default DepartureDisplay;
}
