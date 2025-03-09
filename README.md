# Backend Task - Skillex

This is a Node.js and TypeScript implementation of the backend task for Skillex. The API generates combinations from a list of items, where items starting with the same letter cannot be combined, and stores them in a MySQL database.

## Problem Description

You are given a list of items of different types. Each item type is identified by a prefix letter, and items with the same prefix (starting letter) cannot be selected together in a combination. The API receives a list of numbers representing item types and a required combination length, generates all valid combinations, stores them in a MySQL database, and returns the results in the response.

For example, given an input array like `[1, 2, 1]`, which corresponds to items `A1`, `B1`, `B2`, `C1`, and a combination length of 2, the valid combinations would be:
```
["A1", "B1"], ["A1", "B2"], ["A1", "C1"], ["B1", "C1"], ["B2", "C1"]
```

## Requirements

- Node.js v14+
- MySQL 5.7+

## Setup

### Prerequisites
1. Install Node.js v14 or higher
2. Install MySQL 5.7 or higher:
   - **macOS**: `brew install mysql` or download from mysql.com
   - **Windows**: Download MySQL installer from mysql.com
   - **Linux**: `sudo apt install mysql-server` (Ubuntu/Debian)
   
3. Start MySQL server:
   - **macOS**: `brew services start mysql`
   - **Windows**: Via Services panel or command `net start mysql`
   - **Linux**: `sudo systemctl start mysql`
   
4. Create a database for the project:
   ```sql
   mysql -u root -p
   CREATE DATABASE skillex_db;
   # Optionally create a dedicated user:
   CREATE USER 'skillex_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON skillex_db.* TO 'skillex_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

### Project Setup
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure your MySQL database by editing the `.env` file:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_USER=root  # or your dedicated user
   DB_PASSWORD=your_password
   DB_NAME=skillex_db
   ```
4. Initialize the database schema:
   ```
   npm run setup-db
   ```
5. Build the TypeScript code:
```
npm run build
```
6. Start the server:
```
npm start
```

For development mode with hot-reloading:
```
npm run dev
```

## Database Schema

The database consists of three tables:
- `items`: Stores the items with their letter, value, and code
- `combinations`: Stores generated combinations with their unique IDs
- `combination_items`: Junction table linking combinations to their items
- `responses`: Stores the responses sent to the client

## API Endpoints

### Generate Combinations

```
POST /generate
```

Request Body:
```json
{
  "items": [1, 2, 1],
  "length": 2
}
```

Response:
```json
{
  "id": 1,
  "combination": [
    ["A1", "B1"],
    ["A1", "B2"],
    ["A1", "C1"],
    ["B1", "C1"],
    ["B2", "C1"]
  ]
}
```

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok"
}
```

## Testing

### Manual Testing

You can test the API using the provided test script:
```
npm run test-api
```

This will send a test request to the API and display the response.

### Automated Testing

The project includes both unit and integration tests using Jest:

```bash
# Run all tests
npm test

# Run tests with resource leak detection
npm run test:debug

# Run tests in watch mode (updates when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

#### Resource Leak Detection

The `test:debug` command runs tests with the `--detectOpenHandles` flag, which helps identify resource leaks in your tests, such as:

- Unclosed database connections
- Open file handles
- Running timers or intervals
- Unresolved promises

Use this command when you encounter warnings like:
```
A worker process has failed to exit gracefully and has been force exited. 
This is likely caused by tests leaking due to improper teardown.
```

This is particularly useful for debugging issues with database connections or other resources that might not be properly closed after test execution.

The test suite includes:
- Unit tests for the combination generation algorithm
- Integration tests for the API endpoints
- Test cases for valid and invalid inputs

### Load Testing

The project includes several tools for load testing the API to simulate high traffic and evaluate performance:

#### Prerequisites

Before running load tests, make sure:
1. Your MySQL server is running
2. Your API server is built and running:
   ```bash
   npm run build
   npm start
   ```
3. The database is initialized:
   ```bash
   npm run setup-db
   ```

#### Running Load Tests

You can run load tests using three different approaches:

```bash
# Using Artillery - comprehensive load testing (high load)
# Tests with ramp-up (5-50 RPS) for 60s and constant load (50 RPS) for 120s
npm run load:artillery

# Using Autocannon - lightweight benchmarking (medium load)
# Tests with 100 concurrent connections for 30s
npm run load:autocannon

# Using custom parallel requests script (configurable load)
# Default: 50 concurrent requests, 1000 total requests
npm run load:parallel

# You can also customize concurrency and total requests:
node load-tests/parallel-requests.js 100 5000  # 100 concurrent, 5000 total
```

#### Load Testing Tools

1. **Artillery** - Comprehensive load testing tool with complex scenarios and metrics
   - Supports various load profiles (ramp-up, steady, etc.)
   - Detailed reporting and visualization
   - Uses test data from CSV files
   - Configuration in `load-tests/generate-combinations.yml`

2. **Autocannon** - Lightweight, fast Node.js benchmarking tool
   - Minimal overhead
   - Real-time statistics
   - Simple configuration
   - Implementation in `load-tests/autocannon-test.js`

3. **Custom Parallel Script** - Customizable testing with Promise.all
   - Fine-grained control over request patterns
   - Detailed metrics and percentiles
   - Easily adaptable for specific scenarios
   - Implementation in `load-tests/parallel-requests.js`

#### Test Data

All load tests use the same set of test data from `load-tests/test-data.csv`, which contains various combinations of input arrays and lengths. You can modify this file to test different scenarios.

#### Analyzing Results

The load testing tools provide various metrics to evaluate performance:

- **Throughput**: Requests per second (RPS)
  - Artillery: Check "http.request_rate" in summary
  - Autocannon: Check "Req/Sec" values
  - Custom script: Check "Запросов в секунду" value

- **Latency**: Response time percentiles (p50, p90, p99)
  - These percentiles help understand the distribution of response times
  - p50 (median): 50% of requests are faster than this value
  - p99: 99% of requests are faster than this value (important for SLAs)

- **Error rate**: Percentage of failed requests
  - All tools report error counts and rates

- **Resource usage**: Monitor CPU and memory during tests using system tools:
  ```bash
  # macOS/Linux
  top -l 1 | head -15
  ```

#### Interpreting Results

Good performance indicators for this API:
- Throughput: 1000+ requests per second
- p95 latency: Under 100ms
- Error rate: 0%

If the results don't meet these criteria, check the database connections, query optimization, and algorithmic efficiency of the combination generation.

Use these metrics to identify bottlenecks and optimize your API for production environments.

## Implementation Notes

- Transactions are used to ensure data consistency when storing combinations
- The combination generation algorithm uses a backtracking approach
- Input validation is implemented to ensure proper request formatting
- The API respects the rule where items starting with the same letter cannot be combined 