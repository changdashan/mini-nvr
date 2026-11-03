const SETTINGS = require('./server_settings.js');

//-------------------------------------------------------------------------------------------------
function getcamerainfo(sitecameras, siteid, cameraid){
    let caminfo = null;
    for (const camerainfo of sitecameras){
        if (camerainfo.siteid == siteid && camerainfo.cameraid == cameraid){
            console.log(`siteid: ${camerainfo.siteid}, cameraid: ${camerainfo.cameraid}, videodevice: ${camerainfo.videodevice}`);
            caminfo = camerainfo;
            break;
        }        
    }
    return caminfo;
}

//-------------------------------------------------------------------------------------------------
function getCameraSettingByVideoDevice(sitecameras, siteId, videoDevice){
    let caminfo = null;
    for (const camerainfo of sitecameras){
        if (camerainfo.siteid == siteId && camerainfo.videodevice == videoDevice){
            console.log(`siteid: ${camerainfo.siteid}, cameraid: ${camerainfo.cameraid}, videodevice: ${camerainfo.videodevice}`);
            caminfo = camerainfo;
            break;
        }        
    }
    return caminfo;
}

//-------------------------------------------------------------------------------------------------
function getffmpegtemplate(ffmpegcmd_templates, playerid, streamsource){
    let templat = null;
    for (const template of ffmpegcmd_templates){
        if (template.playerid == playerid && template.streamsource == streamsource){
            console.log(`playerid: ${template.playerid}, streamsource: ${template.streamsource}`);
            templat = template.ffmpegcmd;
            break;
        }        
    }
    return templat;
}

//-------------------------------------------------------------------------------------------------
function setffmpegoptions(ffmpegTemplate, camerainfo, ffmpegVisualOptions, streamServerSettings, token){
    let ffmpegoptions = {};
    ffmpegoptions.CAMERA_ID = camerainfo.cameraid;
    ffmpegoptions.VIDEODEVICE = camerainfo.videodevice;
    ffmpegoptions.streamsource = camerainfo.streamsource;
    ffmpegoptions.WIDTH = ffmpegVisualOptions.width;
    ffmpegoptions.HEIGHT = ffmpegVisualOptions.height;
    ffmpegoptions.B_V = ffmpegVisualOptions.b_v;
    ffmpegoptions.FPS = ffmpegVisualOptions.fps;
    ffmpegoptions.HTTP_PROTOCOL = streamServerSettings.HTTP_PROTOCOL;
    ffmpegoptions.STREAM_SERVICE_IP_PORT = streamServerSettings.SERVER_IP + ":" + streamServerSettings.SERVER_PORT;
    ffmpegoptions.TOKEN = token;
    ffmpegoptions.NOSTATS = camerainfo.nostats;
    if (camerainfo.streamsource === "rtsp"){
        ffmpegoptions.CAMERA_IP = camerainfo.cameraip;
        ffmpegoptions.RTSPPORT = camerainfo.rtspport;
        ffmpegoptions.RTSP = camerainfo.rtsp;
        let rtsp_user = camerainfo.rtspuser;
        let rtsp_pwd = camerainfo.rtsppwd;
        ffmpegoptions.USER_PWD = `${rtsp_user}:${rtsp_pwd}`
    }

    ffmpegoptions.AUDIODEVICE = '';
    ffmpegoptions.AUDIOOPTIONS = '';
    if (ffmpegVisualOptions.audio){
        let audio = true;
        let audioFormat = ffmpegVisualOptions.audioformat||'mp2';
        let audiodevice = camerainfo.audiodevice;
        ffmpegoptions.AUDIODEVICE = (audio? `:audio=\"${audiodevice}\"` : ``);
        ffmpegoptions.AUDIOOPTIONS = (audio? `-c:a ${audioFormat} -ar 44100 -ac 1 -b:a 128k` : ``);
    }

    return ffmpegoptions;
}

//-------------------------------------------------------------------------------------------------
function getffmpegcmd (siteid, cameraid, player, ffmpegVisualOptions, streamServerSettings, token){
    let camerainfo = getcamerainfo(SETTINGS.SITE_CAMERAS, siteid, cameraid);
    if (camerainfo == null)
        console.log('camerainfo is null');
    let streamsource = camerainfo.streamsource;
    let ffmpegtemplate = getffmpegtemplate(SETTINGS.FFMPEGCMD_TEMPLATE_VS_PLAYER, player, streamsource);
    let ffmpegoptions = setffmpegoptions(ffmpegtemplate, camerainfo, ffmpegVisualOptions, streamServerSettings, token);
    console.log(ffmpegoptions);
    let ffmpegcmd = ffmpegtemplate;

    for (const [key, value] of Object.entries(ffmpegoptions)) {
        let keyname = "${" + key + "}";   
        ffmpegcmd = ffmpegcmd.replace(keyname, value); 
    }
    console.log(ffmpegcmd);
    return ffmpegcmd;
}

//-------------------------------------------------------------------------------------------------
function getSiteAndCameraIDs(sitecameras){
    let siteid_cameraids = [];
    for (const caminfo of sitecameras){
        let sitecam = {siteid: caminfo.siteid, cameraid: caminfo.cameraid, label: caminfo.label, enabled: caminfo.enabled};
        siteid_cameraids.push(sitecam);
    }
    return siteid_cameraids;
}

//let sitecameras = getSiteAndCameraIDs(SETTINGS.SITE_CAMERAS);
//console.log(sitecameras);


//-------------------------------------------------------------------------------------------------
module.exports = {
    getcamerainfo:getcamerainfo,
    getffmpegcmd:getffmpegcmd,
    getSiteAndCameraIDs: getSiteAndCameraIDs,
    getCameraSettingByVideoDevice:getCameraSettingByVideoDevice,
}