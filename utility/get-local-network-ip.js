const os = require('os');
const dgram = require('dgram');

//-------------------------------------------------------------------------------------------------
function getPrimaryLocalIP() {  
    return new Promise((resolve, reject) => {
        const socket = dgram.createSocket('udp4');       
        // Connect to a public DNS server (Google DNS). No traffic is actually sent.
        socket.connect(80, '8.8.8.8', () => {
            const { address } = socket.address();
            socket.close();
            resolve(address);
        });

        socket.on('error', (err) => {
            socket.close();
            reject(err);
        });
    });
}

//-------------------------------------------------------------------------------------------------
function getWifiIPAddress() {
    const interfaces = os.networkInterfaces();   
    for (const [interfaceName, networkInterface] of Object.entries(interfaces)) {
        if (interfaceName.toLowerCase().startsWith('wi-fi') || interfaceName.toLowerCase().startsWith('wifi')) {
            //console.log(`Found Wi-Fi interface: ${interfaceName}`);
            //console.log(networkInterface);
            for (const details of networkInterface) {
                if (details.family === 'IPv4' && !details.internal) {
                    return details.address;
                }
            }            
        }
    }    
    //return 'No Wi-Fi Network Interface found';
    return null;
}

/*
getPrimaryLocalIP()
    .then(ip => console.log('Your primary local IP address is:', ip))
    .catch(err => console.error('Error retrieving IP:', err));
*/

//-------------------------------------------------------------------------------------------------
async function getLocalIP(){
    let localIp = getWifiIPAddress();
    if (localIp) 
        return localIp;

    try{
        localIp = await getPrimaryLocalIP();;
    } catch (err) {
        localIp = '127.0.0.1';
    }
    return localIp;
}

//-------------------------------------------------------------------------------------------------
async function main(){
    let localIp = await getLocalIP();
    console.log('my local ip is ' + localIp);
}

main();

module.exports = getLocalIP;