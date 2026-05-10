import { useEffect, useRef, useState } from 'react';
import r2wc from '@r2wc/react-to-web-component';
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider } from 'antd';
import 'leaflet/dist/leaflet.css';
import DepartureDisplay from '../weilSieDichLieben/src/Components/DepartureDisplay';
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

/* When the card has rounded corners (non-panel views), the header bar's right
   edge curves inward and the "Abfahrt in" column risks being clipped. Scale a
   touch of extra right padding with --ha-card-border-radius — 0 in panel mode
   so it stays untouched, ~6px more in non-panel where the radius is 12. */
.ant-row[style*="lightGray" i],
.ant-row[style*="lightgray" i] {
  padding-right: calc(8px + var(--ha-card-border-radius, 0px) / 2);
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

function mirrorDocumentStyles(container: ShadowRoot): () => void {
  const cloneByOrigin = new WeakMap<HTMLStyleElement, HTMLStyleElement>();

  const isAntdStyle = (el: HTMLStyleElement) => el.hasAttribute('data-rc-order');
  const isOurOverride = (el: HTMLStyleElement) => el.hasAttribute('data-weil-overrides');

  const sync = () => {
    for (const src of document.head.querySelectorAll('style')) {
      const styleEl = src as HTMLStyleElement;
      if (isAntdStyle(styleEl) || isOurOverride(styleEl)) continue;
      let clone = cloneByOrigin.get(styleEl);
      if (!clone) {
        clone = document.createElement('style');
        clone.setAttribute('data-mirror-from', 'document.head');
        container.appendChild(clone);
        cloneByOrigin.set(styleEl, clone);
      }
      if (clone.textContent !== styleEl.textContent) {
        clone.textContent = styleEl.textContent;
      }
    }
  };

  sync();
  const observer = new MutationObserver(sync);
  observer.observe(document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  return () => observer.disconnect();
}

const DepartureDisplayWrapper = (props: BridgeProps) => {
  const probeRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    ensureDotMatrixFont();
    if (container || !probeRef.current) return;
    const root = probeRef.current.getRootNode();
    if (root instanceof ShadowRoot) {
      if (!root.querySelector('style[data-weil-overrides]')) {
        const style = document.createElement('style');
        style.setAttribute('data-weil-overrides', '');
        style.textContent = SHADOW_OVERRIDES;
        root.appendChild(style);
      }
      setContainer(root);
    }
  });

  useEffect(() => {
    if (!container) return;
    return mirrorDocumentStyles(container);
  }, [container]);

  const stations = Array.isArray(props.selectedStations)
    ? props.selectedStations.map(normalizeStation)
    : [];

  // The popover trigger lives inside an antd Col with overflow: hidden (the upstream
  // uses that for ellipsis truncation of long station names). Portaling antd popups
  // into triggerNode.parentElement clips the 520px-wide RadarMap to column width.
  // Dedicated portal host at the top of the shadow tree, outside the column, avoids
  // the clip while keeping the popup inside the shadow scope so antd's StyleProvider
  // styles still apply.
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
    },
    shadow: 'open',
  });
  customElements.define(REACT_ELEMENT, Wrapped);
}
