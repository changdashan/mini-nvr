const fs = require('fs');
const camerainfo = require('../cameraInfo.js');
const { getAVDevices } = require('./getwebcamname.js');
const spawnSync = require("child_process").spawnSync;
const server_settings = require('../server_settings.js');

//checed 
function preparing(){

    const result = spawnSync('node ./checkormake-cert.js', {shell: true});

    const siteId = 'my_home';
    const avDevices = getAVDevices();
    let cam_idx = '';
    let label_idx = ''
    if (avDevices.video_devices) {
        for (let i=0; i<avDevices.video_devices.length; i++) {
            const videoDevice = avDevices.video_devices[i];
            console.log('video device:' + videoDevice);
            const camSetting = camerainfo.getCameraSettingByVideoDevice(server_settings.SITE_CAMERAS, siteId, videoDevice);
            if (camSetting == null){
                console.log('The video device not found on the site: ' + siteId);
                const cameraId = `my_web_camera${cam_idx}`;
                const cameraLabel = `My Web Camera${label_idx}`;
                addWebcamToMyHomeSite_in_server_settings(siteId, cameraId, cameraLabel, videoDevice);                
            } else {
                console.log(`The video device found as cameraId ${camSetting.cameraId} on the site: ${siteId} `);
            }
            cam_idx = `_${i+1}`;
            label_idx = ` ${i+1}`;            
        }
    }
}

//-------------------------------------------------------------------------------------------------
function addWebcamToMyHomeSite_in_server_settings(siteId, cameraId, cameraLabel, videoDevice, audioDevice=''){
    const filePath = "../server_settings.js";
    const data = fs.readFileSync(filePath, 'utf8');

    const lines = data.split(/\r?\n/);
    const updatedLines = lines.map(line => {
        if (line === 'const SITE_CAMERAS = [') {
            return `${line}
    {  
        "siteid":"${siteId}", 
        "cameraid": "${cameraId}", 
        "label":"${cameraLabel}", 
        "videodevice":"${videoDevice}", 
        "audiodevice":"${audioDevice}",
        "streamsource":"video", 
        "cameraip":"", 
        "rtsp":"", 
        "rtspport":"", 
        "rtspuser":"", 
        "rtsppwd":"", 
        "fps":25,
        "width":1280,
        "height":720,
        "b_v": "1M",
        "audio": false,
        "audioformat":"mp2",
        "nostats":"-nostats",
        "player":"jsmpeg",
        "enabled":true,       
    },
    `;
        }
        return line;
    });
    const updatedData = updatedLines.join('\r\n');
    fs.writeFileSync(filePath, updatedData, 'utf8');  
    console.log(`The video device: ${videoDevice} has been added as cameraId: ${cameraId} label: ${cameraLabel} to the siteId: ${siteId}`);  
}

preparing();
