const http = require('http');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Test data
const testData = {
  items: [1, 2, 1],
  length: 2
};

// Options for the HTTP request
const options = {
  hostname: 'localhost',
  port: PORT,
  path: '/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(testData))
  }
};

// Make the request
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:');
    console.log(JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(JSON.stringify(testData));
req.end();

console.log('Test request sent. Waiting for response...'); 