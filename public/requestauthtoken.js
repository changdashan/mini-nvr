    // Getting token operation should be donwe on the server side, but for demo purpose, we will do it here.
    // This page should user/password protected, and the token should be generated on the server side and passed to this page.
    
    const STREAM_SERVICE_BASE_URL = window.location.origin;
    const AUTH_SERVICE_URL = STREAM_SERVICE_BASE_URL;
    var WEBSOCKET_BASE_URL
    if (STREAM_SERVICE_BASE_URL.startsWith("https")){
        WEBSOCKET_BASE_URL = STREAM_SERVICE_BASE_URL.replace('https', 'wss');
    } else {
        WEBSOCKET_BASE_URL = STREAM_SERVICE_BASE_URL.replace('http', 'ws');
    }

    const auth = sessionStorage.getItem("auth");
    if (!auth) window.location.href = "./login.html";
    const authPayload = auth ? JSON.parse(auth) : null;
    const authUser = authPayload.username;
    
    function getQueryParam(name, defaultValue) {
        const params = new URLSearchParams(window.location.search);
        return params.has(name) ? params.get(name) : defaultValue;
    }


    let authToken = null;

    //-----------------------------------------------------------------------------------------	    
    async function requestAuthToken() {
        const payload = authPayload;
        const response = await fetch(`${AUTH_SERVICE_URL}/token`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Token request failed: ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.token) {
            throw new Error('No token returned from auth service');
        }

        authToken = data.token;
        return authToken;
    }

    const SITE_ID = getQueryParam('site','my_laptop');
    const CAMERA_ID = getQueryParam('camera','my_laptop_frontcam');

    //-----------------------------------------------------------------------------------------	    
    function getMessagingUrl(token) {
        return `${STREAM_SERVICE_BASE_URL}/${token}/messaging/${SITE_ID}`;
    }

    //-----------------------------------------------------------------------------------------	    
    function getWebSocketUrl(token) {
        return `${WEBSOCKET_BASE_URL}/${token}/${CAMERA_ID}`;
    }

       //-----------------------------------------------------------------------------------------	    
    function getMessagingUrl_2(token, siteId) {
        return `${STREAM_SERVICE_BASE_URL}/${token}/messaging/${siteId}`;
    }

    //-----------------------------------------------------------------------------------------	    
    function getWebSocketUrl_2(token, cameraId) {
        return `${WEBSOCKET_BASE_URL}/${token}/${cameraId}`;
    } 

    //-----------------------------------------------------------------------------------------	    
    async function ensureAuthToken() {
        if (!authToken) {
            return await requestAuthToken();
        }
        return authToken;
    }

    //-----------------------------------------------------------------------------------------	    
    async function sendData(endpointUrl, payload) {
        try {
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.text();
            console.log('Response from sending the message:', data);
        } catch (error) {
            console.error('Error sending request:', error.message);
        }
    }

    //-----------------------------------------------------------------------------------------    
    async function getData(endPointUrl){
        const response = await fetch(`${endPointUrl}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
        });

        if (!response.ok) {
            throw new Error(`getData request failed: ${response.status}`);
        }

        const data = await response.json();
        if (!data) {
            throw new Error('No data returned from getting: ' + endPointUrl);
        }
        
        return data;
    }

    //-----------------------------------------------------------------------------------------	    
    async function messaging(action, options){
        const token = await ensureAuthToken();
        const payload = {
            action: action,
            siteid: SITE_ID,
            cameraid: CAMERA_ID,
            timeout: 300000,
        };

        if (action === 'start' || action === 'restart') {
            payload.ffmpegVisualOptions = options;
        }

        if (action != 'stop' && options[action] !== undefined){
            payload[action] = options[action];
            if (payload[action] === 'uploading' )
                payload.path = options.path;
        }

        await sendData(getMessagingUrl(token), payload);
    }
  
    //-----------------------------------------------------------------------------------------	    
    async function messaging_2(action, options, siteId, cameraId){
        const token = await ensureAuthToken();
        const payload = {
            action: action,
            siteid: siteId,
            cameraid: cameraId,
            timeout: 300000,
        };

        if (action === 'start') {
            payload.ffmpegVisualOptions = options;
        }

        if (action != 'stop' && options[action] !== undefined){
            payload[action] = options[action];
            if (payload[action] === 'uploading' )
                payload.path = options.path;
        }

        await sendData(getMessagingUrl_2(token, siteId), payload);
    }

    //-----------------------------------------------------------------------------------------		
    async function stopStreaming(){	
        await messaging('stop');
        authToken = null;
        if(stopLiveView){
            stopLiveView();
        }
    } 
    
    //-----------------------------------------------------------------------------------------	    
    async function logout() {
        await stopStream();        
        sessionStorage.removeItem("auth");
        window.location.href = "/public/login.html";
    }

    //-----------------------------------------------------------------------------------------
    function endpointUrl(siteId, cameraId) {
        if (!siteId || !cameraId) {
            throw new Error('siteId and cameraId are required to load camera settings');
        }
        if (!authPayload || !authPayload.token) {
            throw new Error('A logged-in user token is required to load camera settings');
        }

        const url = new URL('/camerasettings', window.location.origin);
        url.searchParams.set('token', authPayload.token);
        url.searchParams.set('siteid', siteId);
        url.searchParams.set('cameraid', cameraId);
        return url.toString();
    }

    //-----------------------------------------------------------------------------------------       
    async function loadCamera(siteId, cameraId) {
        const response = await fetch(endpointUrl(siteId, cameraId), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `Camera settings request failed (${response.status})`);
        }
        return result;
    }    

    //-----------------------------------------------------------------------------------------
    // initialized default stream options, which can be overridden by camera settings
    const streamOptions = {
        fps:25,
        width:1280,
        height:720,
        b_v: '2M',
        audio: false,                   
        audioformat:'mp2',
        //audioformat:'aac',
        //player:'jsmpeg-h264',
        //videoformat: 'h264',                
        player:'jsmpeg',               
        videoformat: 'mpeg1video',                			
    };