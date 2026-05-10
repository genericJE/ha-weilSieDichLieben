import r2wc from '@r2wc/react-to-web-component';
import 'leaflet/dist/leaflet.css';
import DepartureDisplay from '../weilSieDichLieben/src/Components/DepartureDisplay';

export const REACT_ELEMENT = 'weil-sie-dich-lieben-departure-display';

interface Station {
  id: string;
  value?: string;
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

interface BridgeProps {
  selectedStations?: Station[];
  fontSize?: number;
  language?: string;
  remarksVisibility?: boolean;
  standardRemarksVisibility?: boolean;
  hideDepartureCol?: boolean;
}

const normalizeStation = (s: Station, idx: number): Station => ({
  suburban: false,
  subway: false,
  tram: false,
  bus: false,
  ferry: false,
  express: false,
  regional: false,
  when: 0,
  results: 6,
  ...s,
  instanceId: idx + 1,
} as Station & { instanceId: number });

const DepartureDisplayWrapper = (props: BridgeProps) => {
  const stations = Array.isArray(props.selectedStations)
    ? props.selectedStations.map(normalizeStation)
    : [];
  return (
    <DepartureDisplay
      selectedStations={stations}
      fontSize={props.fontSize ?? 16}
      language={props.language ?? 'de'}
      remarksVisibility={props.remarksVisibility ?? true}
      standardRemarksVisibility={props.standardRemarksVisibility ?? true}
      hideDepartureCol={props.hideDepartureCol ?? false}
    />
  );
};

if (!customElements.get(REACT_ELEMENT)) {
  const Wrapped = r2wc(DepartureDisplayWrapper, {
    props: {
      selectedStations: 'json',
      fontSize: 'number',
      language: 'string',
      remarksVisibility: 'boolean',
      standardRemarksVisibility: 'boolean',
      hideDepartureCol: 'boolean',
    },
  });
  customElements.define(REACT_ELEMENT, Wrapped);
}
