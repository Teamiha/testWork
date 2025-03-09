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

1. Clone the repository
2. Install dependencies:
```
npm install
```
3. Configure your MySQL database by editing the `.env` file
4. Set up the database:
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

## Testing the API

You can test the API using the provided test script:
```
npm run test-api
```

This will send a test request to the API and display the response.

## Implementation Notes

- Transactions are used to ensure data consistency when storing combinations
- The combination generation algorithm uses a backtracking approach
- Input validation is implemented to ensure proper request formatting
- The API respects the rule where items starting with the same letter cannot be combined 