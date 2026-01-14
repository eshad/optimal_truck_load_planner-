# SmartLoad Optimizer

A REST API that helps find the most profitable combination of shipment orders for a truck. Built with NestJS and TypeScript.

## What does this do?

Given a truck with limited weight/volume capacity and a bunch of available shipment orders, this API figures out which orders to take to maximize profit while staying within all the constraints (weight, volume, hazmat rules, etc).

It's basically solving a constrained knapsack problem using bitmask enumeration.

## Quick Start

**With Docker:**

```bash
docker-compose up --build
```

**Without Docker:**

```bash
npm install
npm run build
npm run start:prod
```

Server runs on port 8080. Swagger docs at http://localhost:8080/api

## Testing it out

Try the sample request:

```bash
curl -X POST http://localhost:8080/api/v1/load-optimizer/optimize \
  -H "Content-Type: application/json" \
  -d @sample-request.json
```

Or just open http://localhost:8080/api and use the Swagger UI to test.

## How it works

The algorithm iterates through all possible combinations of orders (that's why max 22 orders - 2^22 = 4M combinations). For each combination, it checks:

1. Does total weight exceed truck capacity? If yes, skip
2. Does total volume exceed capacity? If yes, skip
3. Are there multiple hazmat orders? If yes, skip
4. Is there a hazmat order mixed with regular orders? If yes, skip
5. Do all orders have same origin/destination? If no, skip
6. Are pickup dates before delivery dates? If no, skip

It keeps track of the combo with highest payout and returns that.

The key optimization is **early pruning** - as soon as we detect a constraint violation, we stop checking that combination and move to the next one. This makes it fast enough for real-time use (<200ms even with 22 orders).

## API Endpoint

```
POST /api/v1/load-optimizer/optimize
```

**Request:**

```json
{
  "truck": {
    "id": "TRUCK-001",
    "max_weight_lbs": 10000,
    "max_volume_cuft": 1000
  },
  "orders": [
    {
      "id": "ORD-001",
      "payout_cents": 25000,
      "weight_lbs": 1500,
      "volume_cuft": 200,
      "origin": "New York, NY",
      "destination": "Los Angeles, CA",
      "pickup_date": "2026-01-15T08:00:00Z",
      "delivery_date": "2026-01-20T18:00:00Z",
      "is_hazmat": false
    }
  ]
}
```

**Response:**

```json
{
  "truck_id": "TRUCK-001",
  "selected_order_ids": ["ORD-001", "ORD-002"],
  "total_payout_cents": 75000,
  "total_weight_lbs": 6500,
  "total_volume_cuft": 750,
  "utilization_weight_percent": 65.0,
  "utilization_volume_percent": 75.0
}
```

Note: Payout is in cents (integer). So 75000 cents = $750.00

## Constraints & Rules

**Hard limits:**

- Max 22 orders per request (performance limitation)
- Total weight must fit in truck
- Total volume must fit in truck
- Only 1 hazmat order allowed per load
- If you select a hazmat order, it must be the ONLY order (can't mix with regular shipments)
- All orders must have same origin and destination
- Pickup date must be before delivery date

**Assumptions I made:**

- Hazmat orders can't be combined with anything else (safety regulation)
- Orders with matching origin/destination can be combined (route-compatible)
- No time slot conflicts if orders are on same route (simplified)
- Using integer cents to avoid floating point errors

## Mobile Integration

This is designed to power a "Find Best Loads" button in a mobile app. See [MOBILE_INTEGRATION.md](./MOBILE_INTEGRATION.md) for code examples in React Native, Swift, and Kotlin.

Basic idea:

```typescript
// User taps "Find Best Loads"
const result = await api.post('/api/v1/load-optimizer/optimize', {
  truck: userTruck,
  orders: availableOrders,
});
// Show result: "Best load: $1,100 (3 orders)"
```

## Project Structure

```
src/
├── main.ts                        # Entry point, starts server on port 8080
├── app.module.ts                  # Root module
└── optimize/
    ├── optimize.controller.ts     # Handles POST /api/v1/load-optimizer/optimize
    ├── optimize.service.ts        # Core algorithm (see evaluateCombination method)
    └── dto/
        ├── optimize-request.dto.ts   # Input validation
        └── optimize-response.dto.ts  # Response format
```

The main logic is in `optimize.service.ts` around line 56-95 (the `evaluateCombination` method).

## Why bitmask approach?

I considered a few options:

1. **Greedy** - Fast but doesn't guarantee optimal solution
2. **Dynamic programming** - Good for some knapsack variants but complex with multiple constraints
3. **Bitmask enumeration** - Brute force but guaranteed optimal

Went with #3 because:

- With n ≤ 22, it's computationally feasible
- Guarantees finding the actual best solution
- Straightforward to implement and debug
- Early pruning makes it fast enough for production

## Performance

Tested on my machine (M1 Mac):

- 5 orders: ~5ms
- 10 orders: ~15ms
- 15 orders: ~50ms
- 22 orders: ~150ms

Should be fast enough for mobile apps (under 200ms threshold for "feels instant").

## Validation

The API validates inputs using class-validator. If you send bad data, you get a 400 with specific error messages:

```json
{
  "statusCode": 400,
  "message": [
    "orders must contain no more than 22 elements",
    "truck.max_weight_lbs must not be less than 0"
  ],
  "error": "Bad Request"
}
```

## Docker

Multi-stage build to keep image size small:

- Stage 1: Build the TypeScript code
- Stage 2: Copy compiled code + production dependencies only

Health check runs every 30 seconds to make sure API is responsive.

## Development

```bash
# Run with hot reload
npm run start:dev

# Build
npm run build

# Run production
npm run start:prod

# Lint
npm run lint

# Format
npm run format

# Tests
npm run test
```

## Tech Stack

- NestJS 11.x
- TypeScript 5.x
- class-validator for input validation
- Swagger for API docs
- Docker for deployment

## Notes

- This is completely stateless (no database)
- Can scale horizontally by running multiple instances
- Money is always in integer cents to avoid rounding issues
- Dates are ISO 8601 format
- CORS is enabled for local development

## License

MIT
