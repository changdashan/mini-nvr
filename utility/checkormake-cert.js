//https://github.com/tjosepo/mkcert-node/tree/main

const fs = require("fs");
const path = require('path');
const mkcert = require("@mkcert/node");
const getLocalIP = require('./get-local-network-ip.js');

//-------------------------------------------------------------------------------------------------
function checkOrInstallCa(){

    const ca_filefolder = mkcert.carootSync();
    console.log("mkcert rootCA file folder: " + ca_filefolder);
    if (ca_filefolder == null || ca_filefolder === ""){    
        console.log("mkcert rootCA folder not found, install one");
        mkcert.installSync();
        const newly_installed_ca_filefolder = mkcert.carootSync();
        console.log("newly install mkcert ca file path: " + newly_installed_ca_filefolder);
        const newly_installed_ca_path =  path.join(newly_installed_ca_filefolder, 'rootCA.pem');  
        return newly_installed_ca_path  
    } else {
        const foundCaFilePath = path.join(ca_filefolder, 'rootCA.pem');
        return foundCaFilePath
    }
}

//-------------------------------------------------------------------------------------------------
function generateKeyAndCert(local_ip){

    const keyFilePath = `../sslcert/${local_ip}-key.pem`;
    const crtFilePath = `../sslcert/${local_ip}.pem`;

    if (!fs.existsSync(keyFilePath) || !fs.existsSync(crtFilePath)) {

        console.log("either key or cert file does not exist. Generate key and cert.");
        mkcert.generateSync({
            install:  false,
            hosts:    [`${local_ip}`],
            keyFile:  keyFilePath,        
            certFile: crtFilePath
        });

    } else {

        console.log( "mkcert key and cert do exist. No need to generate them");
    }  
}

//-------------------------------------------------------------------------------------------------
async function main(){

    const ca_filepath = checkOrInstallCa();
    if (fs.existsSync(ca_filepath)){
        console.log("copying file: " + ca_filepath);
        fs.copyFileSync(ca_filepath, '../rootCA.pem');
        fs.copyFileSync(ca_filepath, '../streampump/rootCA.pem');
    }

    const localIp = await getLocalIP();
    if (localIp) {
        generateKeyAndCert(localIp);
    }

    const updateStreamIpPort = require('./update-stream-server-ip');
    let searchForLine = 'const SSL_KEY_FILE = ';
    let newLine = `./sslcert/${localIp}-key.pem`;

    filepath = '../server_settings.js';
    updateStreamIpPort(filepath, searchForLine, newLine); 

    searchForLine = 'const SSL_CERT_FILE = ';
    newLine = `./sslcert/${localIp}.pem`; 
    updateStreamIpPort(filepath, searchForLine, newLine);         
}

main();

//module.exports = generateKeyAndCert;