import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { networkInterfaces } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;
const ip = '0.0.0.0'; // Listen on all network interfaces

// Serve static files from the dist directory
app.use(express.static(join(__dirname, 'dist')));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, ip, () => {
    // Get local IP address
    const nets = networkInterfaces();
    const localIPs = [];
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                localIPs.push(net.address);
            }
        }
    }
    
    console.log('\nServer running at:');
    console.log(`Local: http://localhost:${port}`);
    localIPs.forEach(ip => {
        console.log(`Network: http://${ip}:${port}`);
    });
}); 