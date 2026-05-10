import { useEffect, useRef, useState } from 'react';
import r2wc from '@r2wc/react-to-web-component';
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider } from 'antd';
import 'leaflet/dist/leaflet.css';
import DepartureDisplay from '../weilSieDichLieben/src/Components/DepartureDisplay';
import dotMatrixFont from '../weilSieDichLieben/src/assets/fonts/DotMatrix-repaired.ttf';

export const REACT_ELEMENT = 'weil-sie-dich-lieben-departure-display';

const FONT_CSS = `
@font-face {
  font-family: 'DotMatrix';
  src: url(${dotMatrixFont}) format('truetype');
  font-display: swap;
}
`;

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
  const probeRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    if (container || !probeRef.current) return;
    const root = probeRef.current.getRootNode();
    if (root instanceof ShadowRoot) {
      if (!root.querySelector('style[data-weil-font]')) {
        const style = document.createElement('style');
        style.setAttribute('data-weil-font', '');
        style.textContent = FONT_CSS;
        root.appendChild(style);
      }
      setContainer(root);
    }
  });

  const stations = Array.isArray(props.selectedStations)
    ? props.selectedStations.map(normalizeStation)
    : [];

  return (
    <div ref={probeRef}>
      {container && (
        <StyleProvider container={container} hashPriority="high">
          <ConfigProvider
            getPopupContainer={(triggerNode) =>
              (triggerNode?.parentElement as HTMLElement | null) ?? document.body
            }
          >
            <DepartureDisplay
              selectedStations={stations}
              fontSize={props.fontSize ?? 16}
              language={props.language ?? 'de'}
              remarksVisibility={props.remarksVisibility ?? true}
              standardRemarksVisibility={props.standardRemarksVisibility ?? true}
              hideDepartureCol={props.hideDepartureCol ?? false}
            />
          </ConfigProvider>
        </StyleProvider>
      )}
    </div>
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
    shadow: 'open',
  });
  customElements.define(REACT_ELEMENT, Wrapped);
}
