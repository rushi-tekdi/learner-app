/**
 * FOR TESTING ONLY — generates Zoom SDK JWT tokens client-side.
 *
 * In production, move token generation to a backend so the SDK Secret
 * is never shipped inside the app binary.
 *
 * Zoom SDK v7 uses TWO separate tokens:
 *   1. Init token  — used once to initialize the SDK
 *   2. Meeting signature — used per-meeting (only needed if joining as host)
 *
 * For attendees joining a meeting, only the init token is required.
 */
import CryptoJS from 'crypto-js';

export type ZoomRole = 0 | 1; // 0 = attendee, 1 = host

const objToBase64url = (obj: object): string => {
  const str = JSON.stringify(obj);
  // encodeURIComponent + unescape handles non-ASCII characters safely
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const strToBase64url = (str: string): string =>
  btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

/**
 * Generate the SDK init JWT for Zoom v7.
 *
 * Payload: { "appKey", "iat", "exp", "tokenExp" }
 * This is passed as `jwtToken` to ZoomSDKInitParams.
 */
export const generateZoomInitToken = (
  sdkKey: string,
  sdkSecret: string,
  expirySeconds = 7200,
): string => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expirySeconds;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { appKey: sdkKey, iat, exp, tokenExp: exp };

  const headerB64 = objToBase64url(header);
  const payloadB64 = objToBase64url(payload);
  const message = `${headerB64}.${payloadB64}`;

  const sig = CryptoJS.HmacSHA256(message, sdkSecret)
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${message}.${sig}`;
};

/**
 * Generate the meeting signature JWT (needed only if joining as host, role=1).
 * Attendees (role=0) can pass an empty string as joinToken.
 *
 * Payload: { "sdkKey", "appKey", "mn", "role", "iat", "exp", "tokenExp" }
 */
export const generateZoomSignature = (
  sdkKey: string,
  sdkSecret: string,
  meetingNumber: string,
  role: ZoomRole = 0,
  expirySeconds = 7200,
): string => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expirySeconds;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { sdkKey, appKey: sdkKey, mn: meetingNumber, role, iat, exp, tokenExp: exp };

  const headerB64 = objToBase64url(header);
  const payloadB64 = objToBase64url(payload);
  const message = `${headerB64}.${payloadB64}`;

  const sig = CryptoJS.HmacSHA256(message, sdkSecret)
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${message}.${sig}`;
};
