import { NativeModules, Platform } from 'react-native';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { generateZoomInitToken, generateZoomSignature, ZoomRole } from './ZoomSignatureHelper';

const { ZoomSDK } = NativeModules;

export interface ZoomJoinParams {
  meetingNumber: string;
  password: string;
  displayName: string;
  /** Meeting join token. Empty string "" is fine for attendees (role 0). */
  joinToken?: string;
}

export interface ZoomJoinTestParams {
  meetingNumber: string;
  password: string;
  displayName: string;
  sdkKey: string;
  sdkSecret: string;
  role?: ZoomRole;
}

/**
 * Initialize Zoom SDK v7 with a pre-built JWT init token.
 * Use generateZoomInitToken() to create the token, or call joinZoomMeetingNoBackend()
 * which handles everything automatically.
 */
export const initZoomSDK = (jwtToken: string): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return Promise.reject(new Error('Zoom native SDK is Android-only in this build'));
  }
  if (!ZoomSDK) {
    return Promise.reject(new Error('ZoomSDK native module not found. Rebuild the Android app.'));
  }
  return ZoomSDK.initZoom(jwtToken);
};

/**
 * Join a meeting. SDK must already be initialized via initZoomSDK().
 * For attendees, joinToken can be omitted or left as "".
 */
export const joinZoomMeeting = (params: ZoomJoinParams): Promise<boolean> => {
  return ZoomSDK.joinMeeting(
    params.meetingNumber,
    params.password,
    params.displayName,
    params.joinToken ?? '',
  );
};

/**
 * Leave the current meeting.
 * @param endForAll true only if you are the host and want to end for everyone
 */
export const leaveZoomMeeting = (endForAll = false): Promise<boolean> => {
  return ZoomSDK.leaveMeeting(endForAll);
};

/**
 * Get current meeting status string (e.g. "MEETING_STATUS_INMEETING", "MEETING_STATUS_IDLE").
 */
export const getZoomMeetingStatus = (): Promise<string> => {
  return ZoomSDK.getMeetingStatus();
};

/**
 * FOR TESTING ONLY — joins a meeting without any backend.
 *
 * Handles the full flow:
 *   1. Request camera + mic + Bluetooth permissions
 *   2. Generate SDK init JWT client-side
 *   3. Initialize SDK
 *   4. Join meeting (attendees don't need a meeting signature)
 *
 * Do NOT use in production — SDK Secret must not be in the app binary.
 */
export const joinZoomMeetingNoBackend = async (params: ZoomJoinTestParams): Promise<boolean> => {
  const { meetingNumber, password, displayName, sdkKey, sdkSecret, role = 0 } = params;

  const hasPermissions = await requestZoomPermissions();
  if (!hasPermissions) {
    throw new Error('Camera and microphone permissions are required to join a meeting.');
  }

  const initToken = generateZoomInitToken(sdkKey, sdkSecret);
  await initZoomSDK(initToken);

  // For hosts (role=1) we pass the meeting signature as joinToken.
  // For attendees (role=0) joinToken can be empty.
  const joinToken = role === 1
    ? generateZoomSignature(sdkKey, sdkSecret, meetingNumber, role)
    : '';

  return joinZoomMeeting({ meetingNumber, password, displayName, joinToken });
};

/**
 * Request camera, microphone, and Bluetooth permissions needed by Zoom.
 * Returns true only if camera + mic are granted (Bluetooth is best-effort).
 */
export const requestZoomPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  const [camera, mic] = await Promise.all([
    request(PERMISSIONS.ANDROID.CAMERA),
    request(PERMISSIONS.ANDROID.RECORD_AUDIO),
    request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT),
  ]);

  return camera === RESULTS.GRANTED && mic === RESULTS.GRANTED;
};
