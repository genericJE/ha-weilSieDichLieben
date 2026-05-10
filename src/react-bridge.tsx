import r2wc from '@r2wc/react-to-web-component';
import 'leaflet/dist/leaflet.css';
import DepartureDisplay from '../weilSieDichLieben/src/Components/DepartureDisplay';

export const REACT_ELEMENT = 'weil-sie-dich-lieben-departure-display';

if (!customElements.get(REACT_ELEMENT)) {
  const Wrapped = r2wc(DepartureDisplay, {
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
