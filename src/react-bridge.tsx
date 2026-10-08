import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import r2wc from '@r2wc/react-to-web-component';
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider } from 'antd';
import leafletCss from 'leaflet/dist/leaflet.css';
import marqueeCss from 'virtual:react-fast-marquee-css';
import DepartureDisplay from '../weilSieDichLieben/src/Components/DepartureDisplay';
import { MOBILE_BREAKPOINT } from '../weilSieDichLieben/src/hooks/useIsMobile';
import dotMatrixFont from '../weilSieDichLieben/src/assets/fonts/DotMatrix-repaired.ttf';

export const REACT_ELEMENT = 'weil-sie-dich-lieben-departure-display';

// Register DotMatrix globally on document.fonts. An @font-face declared *inside*
// a shadow root registers the family for CSS resolution but doesn't reliably make
// the browser use the binary for glyph rendering — declarations on document.fonts
// cross shadow boundaries and actually paint the characters.
let fontRegistered = false;
function ensureDotMatrixFont() {
  if (fontRegistered || typeof document === 'undefined') return;
  fontRegistered = true;
  const face = new FontFace('DotMatrix', `url(${dotMatrixFont}) format('truetype')`);
  face.load()
    .then((loaded) => document.fonts.add(loaded))
    .catch((err) => console.warn('[weilSieDichLieben] DotMatrix font failed to load:', err));
}

// Header background is lightGray (set inline by the upstream DepartureTable). HA's dark
// theme inherits a light text color, leaving the header text invisible. Force a dark
// color on any antd row whose inline style sets lightGray.
const SHADOW_OVERRIDES = `
.ant-row[style*="lightGray" i],
.ant-row[style*="lightgray" i] {
  color: #111;
}

/* HA's theme cascades line-height ~1.6 into the shadow tree, padding rows by
   ~10px each and marquees by ~7px. The upstream relies on the browser default
   ('normal') for tight DotMatrix rows. */
.ant-row,
.rfm-marquee-container,
.rfm-marquee,
.rfm-initial-child-container,
.rfm-child {
  line-height: normal;
}

/* The upstream DepartureTable wrapper has 16px (or 8px on mobile) of horizontal
   padding meant to gutter the content from the browser viewport. Inside an HA
   ha-card that's already a double gutter — drop the horizontal padding so the
   table goes edge-to-edge. The wrapper is identified by its inline border-radius
   (the only div with border-radius: 8px set inline in this tree). !important is
   required to beat the inline style. */
div[style*="border-radius: 8px"] {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
`;

// Everything the upstream tree needs that antd doesn't scope itself (the
// StyleProvider below keeps antd's rules inside the shadow root): Leaflet's map
// chrome, the marquee layout, and the overrides above. One sheet per shadow root.
// HA re-mounts the card on every view switch, and the React tree mounts into
// the same shadow root each time, so later mounts find the sheet and leave it.
const SHADOW_STYLES = `${leafletCss}\n${marqueeCss}\n${SHADOW_OVERRIDES}`;

function ensureShadowStyles(root: ShadowRoot): void {
  if (root.querySelector('style[data-weil-styles]')) return;
  const style = document.createElement('style');
  style.setAttribute('data-weil-styles', '');
  style.textContent = SHADOW_STYLES;
  root.appendChild(style);
}

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
  hideRadar?: boolean;
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
  const portalRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<ShadowRoot | null>(null);
  const [narrow, setNarrow] = useState<boolean>();

  useEffect(() => {
    ensureDotMatrixFont();
    if (container || !probeRef.current) return;
    const root = probeRef.current.getRootNode();
    if (root instanceof ShadowRoot) {
      ensureShadowStyles(root);
      setContainer(root);
    }
  });

  // The upstream picks its phone layout from the viewport width, but a card is
  // usually a fraction of the viewport (half a section, a picker thumbnail).
  // Decide from the card's own width instead, against the same breakpoint, so a
  // narrow card gets the compact layout on a wide screen too. Measured before
  // paint so the first visible render already has the right layout.
  useLayoutEffect(() => {
    const el = probeRef.current;
    if (!el) return;
    const measure = () => setNarrow(el.getBoundingClientRect().width < MOBILE_BREAKPOINT);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stations = Array.isArray(props.selectedStations)
    ? props.selectedStations.map(normalizeStation)
    : [];

  // The popover trigger lives inside an antd Col with overflow: hidden (the upstream
  // uses that for ellipsis truncation of long station names). Portaling antd popups
  // into triggerNode.parentElement clips the 520px-wide RadarMap to column width.
  // Dedicated portal host at the top of the shadow tree, outside the column, avoids
  // the clip while keeping the popup inside the shadow scope so antd's StyleProvider
  // styles still apply. antd's Modal (the compact layout's radar) uses the same
  // container, so it stays inside the shadow scope as well.
  return (
    <div ref={probeRef}>
      {container && (
        <StyleProvider container={container} hashPriority="high">
          <ConfigProvider
            getPopupContainer={() => portalRef.current ?? document.body}
          >
            <DepartureDisplay
              selectedStations={stations}
              fontSize={props.fontSize ?? 16}
              language={props.language ?? 'de'}
              remarksVisibility={props.remarksVisibility ?? true}
              standardRemarksVisibility={props.standardRemarksVisibility ?? true}
              hideDepartureCol={props.hideDepartureCol ?? false}
              hideRadar={props.hideRadar ?? false}
              isMobile={narrow}
            />
          </ConfigProvider>
        </StyleProvider>
      )}
      <div ref={portalRef} data-weil-popup-host></div>
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
      hideRadar: 'boolean',
    },
    shadow: 'open',
  });
  customElements.define(REACT_ELEMENT, Wrapped);
}
