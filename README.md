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

```bash
# Using Artillery - comprehensive load testing
npm run load:artillery

# Using Autocannon - lightweight benchmarking
npm run load:autocannon

# Using custom parallel requests script
npm run load:parallel

# Run custom parallel script with specific concurrency and total requests
node load-tests/parallel-requests.js 100 5000
```

#### Load Testing Tools

1. **Artillery** - Comprehensive load testing tool with complex scenarios and metrics
   - Supports various load profiles (ramp-up, steady, etc.)
   - Detailed reporting and visualization
   - Uses test data from CSV files

2. **Autocannon** - Lightweight, fast Node.js benchmarking tool
   - Minimal overhead
   - Real-time statistics
   - Simple configuration

3. **Custom Parallel Script** - Customizable testing with Promise.all
   - Fine-grained control over request patterns
   - Detailed metrics and percentiles
   - Easily adaptable for specific scenarios

#### Analyzing Results

The load testing tools provide various metrics to evaluate performance:

- **Throughput**: Requests per second (RPS)
- **Latency**: Response time percentiles (p50, p90, p99)
- **Error rate**: Percentage of failed requests
- **Resource usage**: CPU and memory consumption during high load

Use these metrics to identify bottlenecks and optimize your API for production environments.

## Implementation Notes

- Transactions are used to ensure data consistency when storing combinations
- The combination generation algorithm uses a backtracking approach
- Input validation is implemented to ensure proper request formatting
- The API respects the rule where items starting with the same letter cannot be combined 