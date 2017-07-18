var fs = require('fs'); 
var https = require('https');
 
var options = { 
    hostname: 'localhost.ssl', 
    port: 3000, 
    path: '/index.html', 
    method: 'GET', 
    ca: fs.readFileSync('./ca/ca-crt.pem') 
}; 
var req = https.request(options, function(res) { 
    res.on('data', function(data) { 
        process.stdout.write(data); 
    }); 
}); 
req.end();
