//https://github.com/tjosepo/mkcert-node/tree/main

const fs = require("fs");
const path = require('path');
const mkcert = require("@mkcert/node");
const getLocalIP = require('./get-local-network-ip.js');

//-------------------------------------------------------------------------------------------------
function checkOrInstallCa(){
	console.log("\r\nchecking or installing rootCA.pem...");
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
		console.log("no need to create/install rootCA.pem as exiting one found.");
        const foundCaFilePath = path.join(ca_filefolder, 'rootCA.pem');
        return foundCaFilePath
    }
}

//-------------------------------------------------------------------------------------------------
function generateKeyAndCert(local_ip){

	console.log("\r\nchecking or generating key and cert...");
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
        console.log("copying file from: " + ca_filepath);
        fs.copyFileSync(ca_filepath, '../rootCA.pem');
        fs.copyFileSync(ca_filepath, '../streampump/rootCA.pem');
    }

    const localIp = await getLocalIP();
    if (localIp) {
        generateKeyAndCert(localIp);
    }

	console.log("\r\nupdating server_settings.js for SSL_KEY_FILE and SSL_CERT_FILE");
    const updateFile = require('./update-file.js');
    let searchForLine = 'const SSL_KEY_FILE = ';
    let newLine = searchForLine + `'./sslcert/${localIp}-key.pem';`;

    filepath = '../server_settings.js';
    updateFile(filepath, searchForLine, newLine); 

    searchForLine = 'const SSL_CERT_FILE = ';
    newLine = searchForLine + `'./sslcert/${localIp}.pem';`; 
    updateFile(filepath, searchForLine, newLine); 
	
	console.log("Done with preparing for running mini-nvr.");
}

main();

//module.exports = generateKeyAndCert;