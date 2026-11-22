
const logMsg = require('./logger.js');
const { spawn } = require('child_process');

//const appFile = './mini-nvr-server.js';

let restarting = false;

function launch_mini_nvr(appFile, secret, port) {

    if (restarting) return;

    restarting = true;

    try {
        logMsg('[launch_mini_nvr] Launching mini-nvr-min by spawning process...');

        const mini_nvr_service = spawn(process.execPath, [appFile, secret, port], {
            stdio: 'inherit',
            cwd: __dirname
        });

        restarting = false;

        mini_nvr_service.on('error', (err) => {
            logMsg('[launch_mini_nvr] Failed to start Mini-NVR process: ' + err.message);
        });

        mini_nvr_service.on('exit', (code, signal) => {

            logMsg(`[launch_mini_nvr] Mini-NVR exited. Code: ${code}, Signal: ${signal}`);

            setTimeout(() => {
                launch_mini_nvr(appFile, secret, port);
            }, 10000);

        });

    } catch (err) {

        logMsg('Error in spawning mini-nvr-min process: error: ' + err.message);
        restarting = false;

    }
}

const APP_FILE = process.argv[2];
const SERVER_SECRET = process.argv[3];
const SERVER_PORT = process.argv[4];
launch_mini_nvr(APP_FILE, SERVER_SECRET, SERVER_PORT);
