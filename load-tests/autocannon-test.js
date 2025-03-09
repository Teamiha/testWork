const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// Load test data from CSV
const csvData = fs.readFileSync(path.join(__dirname, 'test-data.csv'), 'utf8');
const rows = csvData.trim().split('\n').slice(1); // Skip header

// Process data from CSV, considering quotes
const testData = rows.map(row => {
  // Use regular expression for correct parsing of CSV with quotes
  const match = row.match(/"(\[.*?\])"\s*,\s*(\d+)/);
  
  if (match) {
    const [, itemsStr, lengthStr] = match;
    return {
      items: JSON.parse(itemsStr),
      length: parseInt(lengthStr, 10)
    };
  } else {
    console.error('Failed to parse row:', row);
    return null;
  }
}).filter(Boolean); // Remove null values

// Function for random selection of an element from an array
const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];

console.log(`Loaded ${testData.length} test cases`);

// Test configuration
const instance = autocannon({
  url: 'http://localhost:3000',
  connections: 100, // Number of simultaneous connections
  pipelining: 1,    // Number of requests per connection
  duration: 30,     // Test duration in seconds
  
  requests: [
    {
      method: 'POST',
      path: '/generate',
      setupRequest: (req) => {
        // Choose a random test case for each request
        const testCase = randomItem(testData);
        req.body = JSON.stringify(testCase);
        req.headers['content-type'] = 'application/json';
        return req;
      }
    },
    {
      method: 'GET',
      path: '/health',
      weight: 3 // Request weight (ratio to other requests)
    }
  ]
}, finishedBench);

// Create a file to write results
const outputStream = fs.createWriteStream(`./${Date.now()}-results.json`);
autocannon.track(instance, { outputStream });

// Output progress to console
process.stdout.write('Starting load testing');
instance.on('tick', () => process.stdout.write('.'));

// Handle test completion
function finishedBench(err, res) {
  if (err) {
    console.error('Error:', err);
  }
  
  console.log('\n\nLoad testing results:');
  console.log('Requests per second:', res.requests.average);
  console.log('Latency (average):', res.latency.average, 'ms');
  console.log('Latency (maximum):', res.latency.max, 'ms');
  console.log('Latency (percentiles):');
  console.log('  p50:', res.latency.p50, 'ms');
  console.log('  p90:', res.latency.p90, 'ms');
  console.log('  p99:', res.latency.p99, 'ms');
  
  console.log('\nErrors:', res.errors);
  console.log('\nDetailed results saved to JSON file');
} 