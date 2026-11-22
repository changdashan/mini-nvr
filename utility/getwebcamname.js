const fs = require('fs');
const {spawnSync}  = require('child_process');

//-------------------------------------------------------------------------------------------------
function getVideoAudioDeviceNames(ffmpegOutput) {
    const lines = ffmpegOutput.split(/\r?\n/);
    let match = {}
    let video_devices = [];
    for (const line of lines) {
        let match = line.match(/^\[in#\d+.*?\]\s*"([^"]+)"\s*\(video\)\s*$/);
        if (match){
            video_devices.push(match[1]);
            console.log('a video device found: ' + match[1]);
        }
    }
    let audio_devices = [];
    for (const line of lines) {
        let match = line.match(/^\[in#\d+.*?\]\s*"([^"]+)"\s*\(audio\)\s*$/);
        if (match){
            audio_devices.push(match[1]);
            console.log('an audio device found: ' + match[1]);            
        }
    }
    match.video_devices = video_devices;
    match.audio_devices = audio_devices;
    return match;
}

//-------------------------------------------------------------------------------------------------
function getAVDevices() {
    const console_output = getFFmpegListDeiveOutput();
    const av_devices = getVideoAudioDeviceNames(console_output);

    if (av_devices.video_devices){
        console.log('video_devices.length=' + av_devices.video_devices.length)
    }
    if (av_devices.audio_devices){
        console.log('audio_devices.length=' + av_devices.audio_devices.length)
    }

    let videoDevice = null;
    if (av_devices.video_devices)
        videoDevice = av_devices.video_devices[0];
    console.log('Web Camera Name (video device):' + videoDevice);
    const webcamnameContent = `const WEBCAM_VIDEODEVICE_NAME = "${videoDevice}";\n`;
    fs.writeFileSync('./webcamname.js', webcamnameContent); 

    return av_devices; 
}

//-------------------------------------------------------------------------------------------------
function getFFmpegListDeiveOutput() {

    const ensureDirInPath = require('../ensuredirinpath.js');
    ensureDirInPath('../ffmpeg');

    let console_output = null;

    //const ffmpegcmd = `ffmpeg -list_devices true -f dshow -i dummy 2> ./caminfo.txt`;
    const result = spawnSync('ffmpeg', [
        '-hide_banner',
        '-list_devices', 'true',
        '-f', 'dshow',
        '-i', 'dummy'
    ], {
        shell: false, // Recommended on Windows to correctly resolve system path executables
        encoding: 'utf8' // Automatically converts buffers to strings
    });

    // ffmpeg outputs the device list to stderr and returns a non-zero exit code (usually 1) 
    // even when successful, because "dummy" is an intentional invalid input.
    if (result.stderr) {
        console.log('--- DirectShow Devices Found ---');
        console.log(result.stderr);
        console_output = result.stderr;        
    } else if (result.error) {
        console.error('Failed to start ffmpeg process:', result.error);
    }

    return console_output;
}

getAVDevices();

//-------------------------------------------------------------------------------------------------
module.exports = {
	getAVDevices:getAVDevices,
}