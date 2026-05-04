package com.pratham.learning.zoom

import com.facebook.react.bridge.*
import us.zoom.sdk.*

class ZoomModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ZoomSDK"

    /**
     * Initialize Zoom SDK v7.
     * @param jwtToken  SDK init JWT — payload: { "appKey", "iat", "exp", "tokenExp" }
     *                  Generate this client-side via ZoomSignatureHelper.generateZoomInitToken()
     */
    @ReactMethod
    fun initZoom(jwtToken: String, promise: Promise) {
        val sdk = ZoomSDK.getInstance()
        if (sdk.isInitialized) {
            promise.resolve(true)
            return
        }
        val params = ZoomSDKInitParams().apply {
            this.jwtToken = jwtToken
            domain = "zoom.us"
            enableLog = false
        }
        sdk.initialize(currentActivity, object : ZoomSDKInitializeListener {
            override fun onZoomSDKInitializeResult(errorCode: Int, internalErrorCode: Int) {
                if (errorCode == ZoomError.ZOOM_ERROR_SUCCESS) {
                    promise.resolve(true)
                } else {
                    promise.reject("ZOOM_INIT_FAILED", "Init error: $errorCode / $internalErrorCode")
                }
            }
            override fun onZoomAuthIdentityExpired() {}
        }, params)
    }

    /**
     * Join an existing meeting as an attendee.
     * @param meetingNumber  Meeting number (digits only, e.g. "1234567890")
     * @param password       Meeting password (empty string if none)
     * @param displayName    Name shown in the meeting
     * @param joinToken      Meeting join token (jmak). Pass empty string "" for attendees.
     */
    @ReactMethod
    fun joinMeeting(
        meetingNumber: String,
        password: String,
        displayName: String,
        joinToken: String,
        promise: Promise
    ) {
        val sdk = ZoomSDK.getInstance()
        if (!sdk.isInitialized) {
            promise.reject("NOT_INITIALIZED", "Zoom SDK is not initialized. Call initZoom first.")
            return
        }
        val meetingService = sdk.meetingService ?: run {
            promise.reject("NO_MEETING_SERVICE", "MeetingService is null.")
            return
        }
        val joinParams = JoinMeetingParams().apply {
            this.displayName = displayName
            this.meetingNo = meetingNumber
            this.password = password
            this.join_token = joinToken  // empty string is fine for attendees
        }
        val joinOptions = JoinMeetingOptions().apply {
            no_invite = true
            no_webinar_register_dialog = true
        }
        val result = meetingService.joinMeetingWithParams(currentActivity, joinParams, joinOptions)
        if (result == MeetingError.MEETING_ERROR_SUCCESS) {
            promise.resolve(true)
        } else {
            promise.reject("JOIN_FAILED", "Join error code: $result")
        }
    }

    @ReactMethod
    fun leaveMeeting(endForAll: Boolean, promise: Promise) {
        val sdk = ZoomSDK.getInstance()
        if (sdk.isInitialized) {
            sdk.meetingService?.leaveCurrentMeeting(endForAll)
        }
        promise.resolve(true)
    }

    @ReactMethod
    fun getMeetingStatus(promise: Promise) {
        val sdk = ZoomSDK.getInstance()
        if (!sdk.isInitialized) {
            promise.resolve("NOT_INITIALIZED")
            return
        }
        val status = sdk.meetingService?.meetingStatus
        promise.resolve(status?.name ?: "UNKNOWN")
    }
}
