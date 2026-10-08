import type { HassConnection, HomeAssistantLike } from './types';

// Home Assistant 2026.10 added a map tile proxy (the map_tiles integration)
// that fetches OpenStreetMap tiles with an application User-Agent instead of
// the browser having to identify the installation through its referrer. Its
// endpoints are gated by a short-lived token handed out over the WebSocket.
// This module mirrors the frontend's own src/data/map_tiles.ts: one token per
// connection, shared by every card on the page.

const RASTER_PATH = '/api/map_tiles/raster/{z}/{x}/{y}.png';

// Core rotates every 30 minutes and keeps two tokens live, so one handed out
// now is good for at least 30 more. Refreshing sooner leaves room for a slow
// or missed round trip.
const TOKEN_REFRESH_MS = 20 * 60 * 1000;

// Right after a restart the WebSocket is up before the handler is registered,
// and an older core never registers it at all. Spread the attempts out, then
// leave the radar on OpenStreetMap directly until the connection reconnects.
const ATTEMPT_DELAYS_MS = [0, 2000, 5000, 10000, 15000];

type Listener = (tileUrl: string | undefined) => void;

let connection: HassConnection | undefined;
let hassUrl: string | undefined;
let token: string | undefined;
let acquiring: Promise<void> | undefined;
let refreshTimer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<Listener>();

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// A Leaflet URL template; the token rides in the query because an <img> can
// carry no header. undefined means "no proxy here, use the upstream default".
function currentTileUrl(): string | undefined {
  if (!token) return undefined;
  return `${hassUrl ?? location.origin}${RASTER_PATH}?token=${token}`;
}

async function fetchToken(conn: HassConnection): Promise<boolean> {
  try {
    const result = await conn.sendMessagePromise<{ token: string }>({
      type: 'map_tiles/access_token',
    });
    if (conn !== connection) return true;
    if (result.token !== token) {
      token = result.token;
      const url = currentTileUrl();
      listeners.forEach((listener) => listener(url));
    }
    return true;
  } catch {
    return false;
  }
}

function acquire(conn: HassConnection): Promise<void> {
  acquiring ??= (async () => {
    for (const delay of ATTEMPT_DELAYS_MS) {
      if (delay) await wait(delay);
      if (conn !== connection) return;
      if (await fetchToken(conn)) return;
    }
  })().finally(() => {
    acquiring = undefined;
  });
  return acquiring;
}

// The interval does not fire while the tab is suspended, so the token can be
// stale before it comes round; a reconnect is the reliable signal.
const refresh = () => {
  if (connection) void acquire(connection);
};

function attach(hass: HomeAssistantLike): void {
  detach();
  connection = hass.connection;
  hassUrl = hass.auth?.data?.hassUrl?.replace(/\/+$/, '');
  connection.addEventListener('ready', refresh);
  refreshTimer = setInterval(refresh, TOKEN_REFRESH_MS);
  void acquire(connection);
}

function detach(): void {
  connection?.removeEventListener('ready', refresh);
  if (refreshTimer) clearInterval(refreshTimer);
  connection = undefined;
  hassUrl = undefined;
  token = undefined;
  refreshTimer = undefined;
}

/**
 * Keeps `listener` supplied with the tile URL template to use for the radar
 * map: the instance's proxy while a token is available, otherwise undefined.
 * Called synchronously with the current value; returns the unsubscribe.
 */
export function subscribeRadarTileUrl(hass: HomeAssistantLike, listener: Listener): () => void {
  listeners.add(listener);
  if (hass.connection !== connection) {
    attach(hass);
  }
  listener(currentTileUrl());
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) detach();
  };
}
