const fs = require('fs');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//-------------------------------------------------------------------------------------------------
async function startStreamPumpAndLaunchChrome(PROTOCOL, SERVER_IP, SERVER_PORT, streampumpUser, streampumpuserPassword) {

    console.log('startStreamPumpAndLaunchChrome is called.');

    const spawnSync = require("child_process").spawnSync;
    const result = spawnSync('node ./checkormake-cert.js', {shell: true});

    const siteId = 'my_home';
    let cmd_line = "REM node ./streampump.min.js [mini-nvr server and port] [user] [pwd] [siteid]\r\n";
    cmd_line += `node ./streampump.min.js "${PROTOCOL}://${SERVER_IP}:${SERVER_PORT}" "${streampumpUser}" "${streampumpuserPassword}" "${siteId}"`;
    fs.writeFileSync('../streampump/start_streampump.bat', cmd_line);
     
    // The '/c' argument tells cmd to run the command and then terminate
    const { spawn } = require('node:child_process');    
    const bat = spawn('cmd.exe', ['/c', 'start_streampump.bat'], {
        cwd: '../streampump' // Optional: sets the working directory
    });

    bat.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    bat.stderr.on('data', (data) => {
        console.error(data.toString());
    });

    bat.on('exit', (code) => {
        console.log(`Child process exited with code ${code}`);
    });

    bat.unref();

    await sleep(1000 * 2);

    //open chrome for the demo page
    const demo_url = `${PROTOCOL}://${SERVER_IP}:${SERVER_PORT}/public/index.html`;
    const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
    const chrome = spawn(chromePath, [demo_url], { detached: true, stdio: 'ignore'});
    // Allows the Node.js process to exit independently of the spawned child
    chrome.unref();
}

//-------------------------------------------------------------------------------------------------
async function main(){
    const protocol = process.argv[2];
    const server_ip = process.argv[3];
    const server_port = process.argv[4];
    const streampumpUser = process.argv[5];
    const streampumpuserPassword = process.argv[6];
    console.log('process.argv: '+ process.argv);
    console.log(`startStreamPump argv: ${protocol} ${server_ip} ${server_port} ${streampumpUser} ${streampumpuserPassword}`);
    await startStreamPumpAndLaunchChrome(protocol, server_ip, server_port, streampumpUser, streampumpuserPassword);
}

main();
