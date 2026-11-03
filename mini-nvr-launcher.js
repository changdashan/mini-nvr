
const { spawn } = require('child_process');

const MINI_NVR_JS = './mini-nvr-min.js';
const SERVER_SECRET = process.argv[2];
const SERVER_PORT = process.argv[3] || 8081;

let restarting = false;

function launch_mini_nvr() {

    if (restarting) return;

    restarting = true;

    console.log('Starting Mini-NVR...');

    const mini_nvr_service = spawn(process.execPath, [MINI_NVR_JS, SERVER_SECRET, SERVER_PORT], {
        stdio: 'inherit',
        cwd: __dirname
    });

    restarting = false;

    mini_nvr_service.on('error', (err) => {
        console.error('Failed to start Mini-NVR:', err);
    });

    mini_nvr_service.on('exit', (code, signal) => {

        console.log(
            `Mini-NVR exited. Code: ${code}, Signal: ${signal}`
        );

        setTimeout(() => {
            launch_mini_nvr();
        }, 5000);

    });
}

launch_mini_nvr();
