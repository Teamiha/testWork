const http = require('http');
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

console.log(`Loaded ${testData.length} test cases from CSV`);

// Function to send a single request
function sendRequest(data) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    const start = Date.now();
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const end = Date.now();
        const duration = end - start;
        resolve({
          statusCode: res.statusCode,
          duration,
          success: res.statusCode === 200,
          data: responseData.length > 0 ? JSON.parse(responseData) : null
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(requestData);
    req.end();
  });
}

// Main function to run parallel requests
async function runParallelLoad(concurrentRequests, totalRequests) {
  console.log(`Starting ${totalRequests} requests with parallelism ${concurrentRequests}`);
  
  const results = {
    totalRequests,
    successfulRequests: 0,
    failedRequests: 0,
    totalDuration: 0,
    minDuration: Infinity,
    maxDuration: 0,
    durations: [],
    statusCodes: {}
  };
  
  const startTime = Date.now();
  let completed = 0;
  
  // Function to run a batch of requests
  async function runBatch() {
    const batch = [];
    const batchSize = Math.min(concurrentRequests, totalRequests - completed);
    
    for (let i = 0; i < batchSize; i++) {
      // Random selection of test data
      const testCase = testData[Math.floor(Math.random() * testData.length)];
      batch.push(sendRequest(testCase));
    }
    
    try {
      const batchResults = await Promise.all(batch);
      
      batchResults.forEach(result => {
        results.durations.push(result.duration);
        results.totalDuration += result.duration;
        results.minDuration = Math.min(results.minDuration, result.duration);
        results.maxDuration = Math.max(results.maxDuration, result.duration);
        
        if (result.success) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
        }
        
        results.statusCodes[result.statusCode] = (results.statusCodes[result.statusCode] || 0) + 1;
      });
      
      completed += batchSize;
      
      // Progress
      const progress = Math.floor((completed / totalRequests) * 100);
      process.stdout.write(`\rProgress: ${progress}% (${completed}/${totalRequests})`);
      
      if (completed < totalRequests) {
        await runBatch();
      }
    } catch (error) {
      console.error('Error executing batch of requests:', error);
      results.failedRequests += batchSize;
      completed += batchSize;
      
      if (completed < totalRequests) {
        await runBatch();
      }
    }
  }
  
  await runBatch();
  
  const endTime = Date.now();
  const totalElapsedTime = endTime - startTime;
  
  // Sort durations for percentile calculation
  results.durations.sort((a, b) => a - b);
  
  // Calculate percentiles
  results.averageDuration = results.totalDuration / results.durations.length;
  results.medianDuration = results.durations[Math.floor(results.durations.length / 2)];
  results.p90 = results.durations[Math.floor(results.durations.length * 0.9)];
  results.p95 = results.durations[Math.floor(results.durations.length * 0.95)];
  results.p99 = results.durations[Math.floor(results.durations.length * 0.99)];
  
  // Calculate RPS (requests per second)
  results.requestsPerSecond = completed / (totalElapsedTime / 1000);
  
  console.log('\n\nLoad testing results:');
  console.log('========================================');
  console.log(`Total requests: ${totalRequests}`);
  console.log(`Successful requests: ${results.successfulRequests}`);
  console.log(`Failed requests: ${results.failedRequests}`);
  console.log(`Total time: ${totalElapsedTime}ms`);
  console.log(`Requests per second: ${results.requestsPerSecond.toFixed(2)}`);
  console.log('\nRequest processing time:');
  console.log(`Minimum: ${results.minDuration}ms`);
  console.log(`Average: ${results.averageDuration.toFixed(2)}ms`);
  console.log(`Median: ${results.medianDuration}ms`);
  console.log(`p90: ${results.p90}ms`);
  console.log(`p95: ${results.p95}ms`);
  console.log(`p99: ${results.p99}ms`);
  console.log(`Maximum: ${results.maxDuration}ms`);
  
  console.log('\nStatus codes:');
  Object.keys(results.statusCodes).forEach(code => {
    console.log(`${code}: ${results.statusCodes[code]}`);
  });
  
  // Save results to file
  fs.writeFileSync(
    path.join(__dirname, `parallel-results-${Date.now()}.json`),
    JSON.stringify(results, null, 2)
  );
  console.log('\nResults saved to JSON file');
}

// Run test with 50 parallel requests, 1000 total requests
const concurrentRequests = process.argv[2] ? parseInt(process.argv[2]) : 50;
const totalRequests = process.argv[3] ? parseInt(process.argv[3]) : 1000;

runParallelLoad(concurrentRequests, totalRequests)
  .catch(err => console.error('Error during test execution:', err)); 