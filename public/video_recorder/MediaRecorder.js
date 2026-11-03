"use strict";

let currentStream = null;
let mediaRecorder = null;
let ws = null;
let recordingTimer = null;

let deviceEnumerated = false;

const camvideo = document.getElementById("camvideo");
const btnStartRecording = document.getElementById("btnStartRecording");
const btnStopRecording = document.getElementById("btnStopRecording");
const cameras = document.getElementById("camera");

const btnShowRecordings = document.getElementById("btnShowRecordings");
const imgShowRecording = document.getElementById("imgShowRecording");
const videoShowRecording = document.getElementById("videoShowRecording");

const errmsg = document.getElementById("errormsg");
const playbackDiv = document.getElementById("playbackDiv");
const cliplistDiv = document.getElementById("cliplist");
const timeElapsed = document.getElementById("timeElapsed");

camvideo.style.display = "none";
playbackDiv.style.display = "none";
cliplistDiv.style.display = "none";

/* ============================================================
   Helpers
   ============================================================ */

function getScreenSize () {
    var width = window.innerWidth;
    var height = window.innerHeight;
    return { width: width, height: height };
}

function showError(message) {
    console.error(message);
    if (errmsg) {
        errmsg.textContent = message;
        errmsg.style.color = "red";
    }
}

function clearError() {
    if (errmsg) {
        errmsg.textContent = "";
    }
}

function describeError(error) {
    return {
        name: error?.name || "(unknown)",
        message: error?.message || String(error),
        constraint: error?.constraint || null,
        stack: error?.stack || null
    };
}

function stopMediaTracks(stream) {
    if (!stream) {
        return;
    }
    stream.getTracks().forEach(track => {
        try {
            track.stop();
        } catch (e) {
            console.warn("Error stopping track:", e);
        }
    });
}

function stopCurrentStream() {
    if (currentStream) {
        stopMediaTracks(currentStream);
        currentStream = null;
    }
    camvideo.srcObject = null;
}

function cleanupRecording() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }

    if (mediaRecorder) {
        try {
            if (mediaRecorder.state !== "inactive") {
                mediaRecorder.stop();
            }
        } catch (e) {
            console.warn("MediaRecorder stop:", e);
        }
        mediaRecorder = null;
    }

    stopCurrentStream();

    if (ws) {
        try {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        } catch (e) {
            console.warn("WebSocket close:", e);
        }
        ws = null;
    }
}


/* ============================================================
   Camera enumeration
   ============================================================ */
async function enumerateCameras() {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== "function") {
        showError("enumerateDevices() is not supported.");
        return;
    }

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        cameras.innerHTML = "";
        /*
         * First option means "use default/environment camera".
         */
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Default / Rear Camera";
        cameras.appendChild(defaultOption);
        videoDevices.forEach((device, index) => {
            const option = document.createElement("option");
            option.value = device.deviceId;
            option.textContent = device.label || `Camera ${index + 1}`;
            cameras.appendChild(option);
        });

        deviceEnumerated = true;
        console.log("Camera devices:", videoDevices);
    } catch (error) {
        console.error("enumerateDevices() failed:", describeError(error));
    }
}


/* ============================================================
   MediaRecorder MIME selection
   ============================================================ */

function getSupportedMimeType() {
    if (!window.MediaRecorder) {
        throw new Error("MediaRecorder is not supported.");
    }

    const mimeTypes = [
        /*
         * Safari / iOS commonly prefers MP4.
         */
        'video/mp4;codecs="avc1.424028,mp4a.40.2"',
        'video/mp4',

        /*
         * Other browsers may prefer WebM.
         */
        'video/webm;codecs=vp8,opus',
        'video/webm'
    ];

    for (const type of mimeTypes) {
        try {
            if (MediaRecorder.isTypeSupported(type)) {
                console.log("MediaRecorder MIME selected:", type);
                return type;
            }
        } catch (error) {
            console.warn("isTypeSupported failed for:", type, error);
        }
    }

    /*
     * Empty string lets the browser select its
     * preferred recording format.
     */
    console.warn("No explicitly tested MIME type is supported. " + "Using browser default.");

    return "";
}


/* ============================================================
   Start recording
   ============================================================ */
btnStartRecording.addEventListener("click", async function () {
    playbackDiv.style.display = "none";
    cliplistDiv.style.display = "none";
    clearError();
    btnStartRecording.disabled = true;
    try {
        /*
            * IMPORTANT:
            *
            * Request camera/microphone BEFORE doing the
            * authentication network operation.
            */
        await startMediaRecording();
    } catch (error) {
        console.error("Recording failed:", describeError(error));
        showError("Recording failed: " + (error.name || "") + " - " + (error.message || error));
        cleanupRecording();
        camvideo.style.display = "none";
    } finally {
        btnStartRecording.disabled = false;
    }
});

/* ============================================================
   Stop recording
   ============================================================ */
btnStopRecording.addEventListener("click", async function () {
    clearError();
    btnStopRecording.disabled = true;
    try {
        /*
            * IMPORTANT:
            *
            * Request camera/microphone BEFORE doing the
            * authentication network operation.
            */
        await stopMediaRecording();
        console.log("MediaRecorder stopped.");

    } catch (error) {
        console.error("Error in calling stopMediaRecording:", describeError(error));
        camvideo.style.display = "none";
    } finally {
        btnStopRecording.disabled = false;
    }
});

/* ============================================================
   Stop recording
   ============================================================ */
function stopMediaRecording(){
    console.log("Stopping Media Recording.");
    cleanupRecording();
}

/* ============================================================
   Main media acquisition + recording
   ============================================================ */
async function startMediaRecording() {

    if (!window.isSecureContext) {
        throw new Error("The page is not running in a secure context.");
    }

    if (!navigator.mediaDevices) {
        throw new Error("navigator.mediaDevices is unavailable.");
    }

    if (typeof navigator.mediaDevices.getUserMedia !== "function") {
        throw new Error("getUserMedia() is unavailable.");
    }

    /*
     * Stop anything left over from a previous recording.
     */
    cleanupRecording();

    camvideo.style.display = "block";
    playbackDiv.style.display = "none";

    /* --------------------------------------------------------
       Build video constraints
       -------------------------------------------------------- */
    let videoConstraints = { facingMode: {ideal: "environment"} };

    /*
     * If user selected a specific camera, PREFER it.
     *
     * Notice that we use "ideal", not "exact".
     */
    if (cameras.value !== "") {
        videoConstraints = { deviceId: {ideal: cameras.value} };
    }

    const constraints = {video: videoConstraints, audio: true};

    console.log("Requesting media:", constraints);

    /* --------------------------------------------------------
       THIS IS THE IMPORTANT PART
       -------------------------------------------------------- */
    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
        console.error("getUserMedia FAILED:", describeError(error));
        /*
         * Give ourselves detailed diagnostics.
         */
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            console.log(
                "Devices after getUserMedia failure:",
                devices.map(d => ({ kind: d.kind, label: d.label, deviceId: d.deviceId }))
            );
        } catch (e) {
            console.warn( "enumerateDevices after failure:", e);
        }

        throw error;
    }

    currentStream = stream;

    /* --------------------------------------------------------
       Verify the tracks we actually received
       -------------------------------------------------------- */
    const audioTracks = stream.getAudioTracks();
    const videoTracks = stream.getVideoTracks();

    console.log("Received audio tracks:", audioTracks);
    console.log("Received video tracks:", videoTracks);

    if (audioTracks.length === 0) {
        throw new Error("getUserMedia succeeded, but returned no audio track.");
    }

    if (videoTracks.length === 0) {
        throw new Error("getUserMedia succeeded, but returned no video track.");
    }

    console.log( "Audio settings:", audioTracks[0].getSettings ? audioTracks[0].getSettings() : {} );
    console.log( "Video settings:", videoTracks[0].getSettings ? videoTracks[0].getSettings() : {} );

    /* --------------------------------------------------------
       Display camera
       -------------------------------------------------------- */
    camvideo.srcObject = stream;
    camvideo.muted = true;
    camvideo.autoplay = true;
    camvideo.playsInline = true;

    try {
        await camvideo.play();
    } catch (error) {
        console.warn("video.play() failed:", error);
    }

    /* --------------------------------------------------------
       NOW get authentication token
       -------------------------------------------------------- */
    const token = await ensureAuthToken();

    /* --------------------------------------------------------
       WebSocket
       -------------------------------------------------------- */
    const websocketUrl = getWebSocketUrl(token) + "/record/" + authUser;
    console.log("Opening WebSocket:", websocketUrl);

    ws = new WebSocket(websocketUrl);
    ws.onerror = function (error) {
        console.error( "WebSocket error:", error);
        showError("WebSocket connection error.");
    };

    ws.onclose = function () {
        console.log("WebSocket closed.");
    };

    ws.onopen = function () {
        console.log("WebSocket opened.");

        /* ----------------------------------------------------
           MediaRecorder
           ---------------------------------------------------- */
        const mimeType = getSupportedMimeType();
        const options = mimeType ? { mimeType: mimeType } : {};

        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (error) {
            console.error("MediaRecorder creation failed:", describeError(error));
            showError("MediaRecorder failed: " + error.message);
            cleanupRecording();
            return;
        }

        console.log("MediaRecorder MIME type:", mediaRecorder.mimeType);

        mediaRecorder.onstart = function () {
            console.log( "MediaRecorder started." );
        };

        mediaRecorder.onerror = function (event) {
            console.error("MediaRecorder error:", event);
            showError("MediaRecorder error.");
        };

        mediaRecorder.ondataavailable = function (event) {
            console.log("dataavailable:", event.data.size, "bytes", event.data.type);
            if (ws && ws.readyState === WebSocket.OPEN && event.data.size > 0) {
                ws.send(event.data);
            } else {
                console.warn("Cannot send recording chunk. " + "WebSocket is not open.");
            }
        };

        mediaRecorder.onstop = function () {
            console.log("MediaRecorder stopped.");
            /* The final dataavailable event should have already been generated before/around this event. */
        };

        /*
         * 500 ms chunks.
         */
        const targetSlice = 500;
        mediaRecorder.start(targetSlice);

        /* ----------------------------------------------------
           Recording timer
           ---------------------------------------------------- */
        let sec = 0;
        const max = parseInt(document.getElementById("RecordTime").value, 10);
        timeElapsed.textContent = "Time Elapsed 0";
        recordingTimer = setInterval(function () {
            sec++;
            timeElapsed.textContent = "Time Elapsed " + sec;

            if (sec >= max) {
                clearInterval(recordingTimer);
                recordingTimer = null;
                console.log("Recording time reached.");

                /*
                    * Stop MediaRecorder first.
                    *
                    * This is important because stop()
                    * causes the final dataavailable event.
                    */
                if ( mediaRecorder &&mediaRecorder.state !== "inactive") {
                    mediaRecorder.stop();
                }

                /*
                    * Give the final chunk a chance to
                    * reach the WebSocket before closing it.
                    */
                setTimeout(function () {
                    stopCurrentStream();
                    if (ws) {
                        try {
                            ws.close();
                        } catch (e) {
                            console.warn(e);
                        }
                        ws = null;
                    }
                    camvideo.style.display = "none";
                }, 1500);
            }
        }, 1000);
    };

    /*
     * Refresh device list now that permission has
     * been granted.
     */
    await enumerateCameras();
}

/* ============================================================
   Camera changed
   ============================================================ */
cameras.addEventListener("change", function () {
        console.log("Camera selected:", cameras.value);
    }
);

/* ============================================================
   Show recorded video
   ============================================================ */
btnShowRecordings.addEventListener("click", async function () {
    const token = await ensureAuthToken();
    const url = "./recorded/" + authUser + "?token=" + token;
    const response = await fetch(`${url}`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
    });

    if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data) {
        throw new Error('No token returned from auth service');
    }

    let htmlstr = '';
    let cliplistDiv = document.getElementById('cliplist');
    data.forEach(function(currentValue, index, array){
        let clipname = currentValue.filename;
        let clipurl = './recorded/' + authUser + '/' + clipname; //currentValue.relativePath;
        htmlstr += `<a href='${clipurl}' onclick='playbackclip(event)'>${clipname}</a><br/>`;
    });
    cliplistDiv.innerHTML = htmlstr;
    cliplistDiv.style.display = "block";
});

//-------------------------------------------------------------------------------------------------
function playbackclip(event) {
    event.preventDefault();
    const link = event.currentTarget;
    const url = new URL(link.href, window.location.origin);
    playRecordedClip(url.pathname);
}

//-------------------------------------------------------------------------------------------------
async function playRecordedClip(recordedSrc) {
    playbackDiv.style.display = "block";
    console.log("Playing recording:", recordedSrc);
    const token = await ensureAuthToken();
    videoShowRecording.src = recordedSrc + "?token=" + token;
    try {
        const screenSize = getScreenSize();
        if (screenSize.width < 768) {
            videoShowRecording.width = screenSize.width * 0.95; // 90% of screen width
            videoShowRecording.height = screenSize.height * 0.95; // 80% of screen height
            playbackDiv.style.width = videoShowRecording.width + "px";
            playbackDiv.style.height = videoShowRecording.height + "px";    
        }

        await videoShowRecording.play();
    } catch (error) {
        console.warn("Playback failed:", error);
    }
};

/* ============================================================
   Initial page setup
   ============================================================ */
(async function initialize() {

    console.log("Secure context:", window.isSecureContext);
    console.log("MediaDevices:", !!navigator.mediaDevices);
    console.log("getUserMedia:", !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    console.log("MediaRecorder:", !!window.MediaRecorder);

    if (!window.isSecureContext) {
        showError("This page is NOT a secure context. " + "Camera/microphone access may not work." );
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError("getUserMedia() is not available.");
        return;
    }

    if (!window.MediaRecorder) {
        showError("MediaRecorder is not supported.");
        return;
    }

    /*
     * Populate the camera list.
     *
     * Labels may initially be blank until permission
     * has been granted. This is normal.
     */
    await enumerateCameras();
})();
