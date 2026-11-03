const RUNPROTOCOL = "https";
const LAUNCH_STREAMPUMP_SERVICE = true;
const DAYS_OF_KEEPING_RECORDING_FILES = 3;
const DAYS_OF_KEEPING_EVENT_FOOTAGES = 7;

const SENDING_ALERT_EMAIL = false;

const RABBITMQ_USER = 'guest';
const RABBITMQ_PASSWORD = 'guest';

const SSL_KEY_FILE = './sslcert/192.168.1.167-key.pem'
const SSL_CERT_FILE = './sslcert/192.168.1.167.pem'

const DEFAULT_TOKEN_EXPIRY_SECONDS = 30000;
const DEFAULT_AUDIENCE = 'stream-server';


//-------------------------------------------------------------------------------------------------
const CLIENTSECRETS = {
    app1: 'app1-secret',
    app2: 'app2-secret',
    liveviewapp: 'liveviewapp-secret',
    streampump: 'streampump-secret',
    ffmpegservice: 'ffmpeg-service-secret'
};

//-------------------------------------------------------------------------------------------------
const USERACCOUNTS = {
    admin: {
        password: 'admin!23',
        roles: ['administrators'],
    },
    viewer: {
        password: 'Viewer_Password!23',
        roles: ['viewers'],
    },
    streampump_user: {
        password: 'StreamPump_Password!23',
        roles:['']
    }
};

//-------------------------------------------------------------------------------------------------
const CV_OPTIONS = {
    width:640,
    height:480,
    fps:15, 
    mincontourarea:500,
    motionframesrequired:5, 
    preseconds:2,
    postseconds:8,
    executionprovider:'dml',
    object_confidence_threshold:0.40,
}

//-------------------------------------------------------------------------------------------------
const SITE_CAMERAS = [   
    {  
        "siteid":"my_home", 
        "cameraid": "my_web_camera", 
        "label":"My Web Camera", 
        "videodevice":"Integrated Webcam", 
        "audiodevice":"",
        "streamsource":"video", 
        "cameraip":"", 
        "rtsp":"", 
        "rtspport":"", 
        "rtspuser":"", 
        "rtsppwd":"", 
		"fps":25,
		"width":1280,
		"height":720,
		"b_v": "2M",
		"audio": false,
		"audioformat":"mp2",
        "nostats":"-nostats",
		"player":"jsmpeg",
        "enabled":true,        
    }, 
    
    {
        "siteid":"my_home",
        "cameraid":"front_door_cam", 
        "label":"Front Door Camera", 
        "videodevice":"",
        "audiodevice":"",      
        "streamsource":"rtsp", 
        "cameraip":"192.168.1.168", 
        "rtsp":"rtsp://[user:password]@192.168.1.168:554/stream0", 
        "rtspport":"554", 
        "rtspuser":"", 
        "rtsppwd":"", 
		"fps":25,
		"width":1280,
		"height":720,
		"b_v": "2M",
		"audio": false,
		"audioformat":"mp2",
        "nostats":"-nostats",        
		"player":"jsmpeg", 
        "enabled":true,                               
    },  

    {  
        "siteid": "my_home", 
        "cameraid" :"my_desktop_cam", 
        "label":"My Desktop Cam", 
        "videodevice":"Brio 100",
        "audiodevice":"",
        "streamsource":"video", 
        "cameraip":"", 
        "rtsp":"", 
        "rtspport":"", 
        "rtspuser":"", 
        "rtsppwd":"",
		"fps":25,
		"width":1280,
		"height":540,
		"b_v": "1M",
		"audio": false,
		"audioformat":"mp2",
        "nostats":"-nostats",        
		"player":"jsmpeg",
        "enabled":true,                         
    },

    {
        "siteid":"my_home",
        "cameraid":"back_yard_cam", 
        "label":"Back Yard Camera", 
        "videodevice":"",
        "audiodevice":"",
        "streamsource":"rtsp", 
        "cameraip":"", 
        "rtsp": "", 
        "rtspport":"554", 
        "rtspuser":"", 
        "rtsppwd":"",
		"fps":25,
		"width":1280,
		"height":720,
		"b_v": "1M",
		"audio": false,
		"audioformat":"mp2",
        "nostats":"",        
		"player":"jsmpeg", 
        "enabled":false,                               
    },  
    
    {
        "siteid":"my_home",
        "cameraid":"drive_way_cam", 
        "label":"Drive Way Camera", 
        "videodevice":"",
        "audiodevice":"",
        "streamsource":"rtsp", 
        "cameraip":"", 
        "rtsp":"", 
        "rtspport":"554", 
        "rtspuser":"", 
        "rtsppwd":"", 
		"fps":25,
		"width":1280,
		"height":720,
		"b_v": "2M",
		"audio": false,
		"audioformat":"mp2",
        "nostats":"",        
		"player":"jsmpeg", 
        "enabled":false,                              
    }, 
    
    {
        "siteid":"my_home",
        "cameraid":"bay_room_camera", 
        "label":"Baby Room Camera", 
        "videodevice":"",
        "audiodevice":"",
        "streamsource":"rtsp", 
        "cameraip":"", 
        "rtsp":"", 
        "rtspport":"", 
        "rtspuser":"", 
        "rtsppwd":"", 
		"fps":30,
		"width":800,
		"height":450,
		"b_v": "2M",
		"audio": false,
		"audioformat":"mp2",
        "nostats":"",        
		"player":"jsmpeg", 
        "enabled":false,                             
    },     
     
]

//-------------------------------------------------------------------------------------------------
const FFMPEGCMD_TEMPLATE_VS_PLAYER = [
    {
        "playerid":"jsmpeg","streamsource":"video", "ffmpegcmd":
        "ffmpeg -f dshow -i video=\"${VIDEODEVICE}\"${AUDIODEVICE} -r ${FPS} -s ${WIDTH}x${HEIGHT} -pix_fmt yuv420p -c:v mpeg1video -b:v ${B_V} ${AUDIOOPTIONS} ${NOSTATS} -f mpegts ${HTTP_PROTOCOL}://${STREAM_SERVICE_IP_PORT}/${TOKEN}/streaming/${CAMERA_ID}",
    },
    {
        "playerid":"jsmpeg","streamsource":"rtsp","ffmpegcmd":
        "ffmpeg -i ${RTSP} -r ${FPS} -s ${WIDTH}x${HEIGHT} -pix_fmt yuv420p -c:v mpeg1video -b:v ${B_V} ${AUDIOOPTIONS} ${NOSTATS} -f mpegts ${HTTP_PROTOCOL}://${STREAM_SERVICE_IP_PORT}/${TOKEN}/streaming/${CAMERA_ID}",
    },
    {
        "playerid":"h264","streamsource":"video","ffmpegcmd":
        "ffmpeg -f dshow -i video=\"${VIDEODEVICE}\" -r ${FPS} -s ${WIDTH}x${HEIGHT} -pix_fmt yuv420p -c:v libx264 -b:v ${B_V} -bufsize 500k -profile:v baseline -tune zerolatency -f rawvideo ${HTTP_PROTOCOL}://${STREAM_SERVICE_IP_PORT}/${TOKEN}/streaming/${CAMERA_ID}",
    },
    {
        "playerid":"h264","streamsource":"rtsp","ffmpegcmd":
        "",
    },
    {
        "playerid":"jsmpeg-h264","streamsource":"video","ffmpegcmd":
        "ffmpeg -f dshow -i video=\"${VIDEODEVICE}\"${AUDIODEVICE} -r ${FPS} -s ${WIDTH}x${HEIGHT} -pix_fmt yuv420p -c:v libx264 -b:v ${B_V} -bufsize 500k -profile:v baseline ${AUDIOOPTIONS} -tune zerolatency ${NOSTATS} -f mpegts ${HTTP_PROTOCOL}://${STREAM_SERVICE_IP_PORT}/${TOKEN}/streaming/${CAMERA_ID}",
    },
    {
        "playerid":"h264","streamsource":"rtsp","ffmpegcmd":
        "",
    },    
    {
        "playerid":"webm-vp8","streamsource":"video","ffmpegcmd":
        "ffmpeg -f dshow -i video=\"${VIDEODEVICE}\" -r ${FPS} -s ${WIDTH}x${HEIGHT} -c:v vp8 -b:v ${B_V} -g 25 -f webm ${HTTP_PROTOCOL}://${STREAM_SERVICE_IP_PORT}/${TOKEN}/streaming/${CAMERA_ID}",
    },
    {
        "playerid":"webm-vp8","streamsource":"rtsp","ffmpegcmd":
        "ffmpeg.exe -buffer_size 2000000 -i rtsp://${USER_PWD}@${CAMERAIP}:${RTSPPORT}/${RTSP} -r ${FPS} -s ${WIDTH}x${HEIGHT} -f webm -v:c vp8 -g 20 ${HTTP_PROTOCOL}://${STREAM_SERVICE_IP_PORT}/${TOKEN}/streaming/${CAMERA_ID}",
    },            
]

//-------------------------------------------------------------------------------------------------
const EMAILINFO = {
    service:'gmail',
    user:'[yourgmailname]@gmail.com',
    pass:'your gmail pass key',
    sender: 'yourgmailname]@gmail.com',
    recipient: '[yourgmail_or_other_email_address, e,g., abcdc@hotmail.com]'
}

//-------------------------------------------------------------------------------------------------
module.exports = {
    RUNPROTOCOL:RUNPROTOCOL,
    LAUNCH_STREAMPUMP_SERVICE:LAUNCH_STREAMPUMP_SERVICE,
    RABBITMQ_USER:RABBITMQ_USER,
    RABBITMQ_PASSWORD:RABBITMQ_PASSWORD,
    DEFAULT_TOKEN_EXPIRY_SECONDS:DEFAULT_TOKEN_EXPIRY_SECONDS,
    DEFAULT_AUDIENCE:DEFAULT_AUDIENCE,
    CLIENTSECRETS:CLIENTSECRETS,
    USERACCOUNTS:USERACCOUNTS,
    SITE_CAMERAS:SITE_CAMERAS,
    FFMPEGCMD_TEMPLATE_VS_PLAYER:FFMPEGCMD_TEMPLATE_VS_PLAYER,
    SSL_KEY_FILE:SSL_KEY_FILE,
    SSL_CERT_FILE:SSL_CERT_FILE,
    SENDING_ALERT_EMAIL:SENDING_ALERT_EMAIL,
    EMAILINFO:EMAILINFO,
    CV_OPTIONS:CV_OPTIONS,
    DAYS_OF_KEEPING_RECORDING_FILES:DAYS_OF_KEEPING_RECORDING_FILES,
    DAYS_OF_KEEPING_EVENT_FOOTAGES:DAYS_OF_KEEPING_EVENT_FOOTAGES,
}
