# Testing Guide

## Running the API

**Docker (easiest):**

```bash
docker-compose up --build
```

**Local:**

```bash
npm install
npm run build
npm run start:prod
```

Server starts on http://localhost:8080

## Testing Methods

### 1. Swagger UI (recommended for quick testing)

Open http://localhost:8080/api in your browser

1. Find the POST `/api/v1/load-optimizer/optimize` endpoint
2. Click "Try it out"
3. Edit the request body if you want
4. Click "Execute"
5. See the response below

### 2. cURL

**Use the sample file:**

```bash
curl -X POST http://localhost:8080/api/v1/load-optimizer/optimize \
  -H "Content-Type: application/json" \
  -d @sample-request.json
```

**Inline request:**

```bash
curl -X POST http://localhost:8080/api/v1/load-optimizer/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "truck": {
      "id": "TRUCK-001",
      "max_weight_lbs": 10000,
      "max_volume_cuft": 1000
    },
    "orders": [{
      "id": "ORD-001",
      "payout_cents": 25000,
      "weight_lbs": 1500,
      "volume_cuft": 200,
      "origin": "New York, NY",
      "destination": "Los Angeles, CA",
      "pickup_date": "2026-01-15T08:00:00Z",
      "delivery_date": "2026-01-20T18:00:00Z",
      "is_hazmat": false
    }]
  }'
```

### 3. Postman

1. Create new POST request
2. URL: `http://localhost:8080/api/v1/load-optimizer/optimize`
3. Headers: `Content-Type: application/json`
4. Body: Raw JSON, paste the request from sample-request.json
5. Send

## Expected Results

**Success:**

```json
{
  "truck_id": "TRUCK-A1",
  "selected_order_ids": ["ORD-002", "ORD-003", "ORD-005"],
  "total_payout_cents": 110000,
  "total_weight_lbs": 7500,
  "total_volume_cuft": 830,
  "utilization_weight_percent": 75,
  "utilization_volume_percent": 83
}
```

The sample data has 5 orders. The API picks 3 of them (skipping the hazmat order and one lower-value order) for a total of $1,100.

**Validation error:**

```json
{
  "statusCode": 400,
  "message": ["orders must contain no more than 22 elements"],
  "error": "Bad Request"
}
```

## Test Scenarios

### Basic Valid Request

3 regular orders, all fit in truck:

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
      "origin": "NYC",
      "destination": "LA",
      "pickup_date": "2026-01-15T08:00:00Z",
      "delivery_date": "2026-01-20T18:00:00Z",
      "is_hazmat": false
    },
    {
      "id": "ORD-002",
      "payout_cents": 30000,
      "weight_lbs": 2000,
      "volume_cuft": 250,
      "origin": "NYC",
      "destination": "LA",
      "pickup_date": "2026-01-15T09:00:00Z",
      "delivery_date": "2026-01-20T17:00:00Z",
      "is_hazmat": false
    },
    {
      "id": "ORD-003",
      "payout_cents": 35000,
      "weight_lbs": 2500,
      "volume_cuft": 300,
      "origin": "NYC",
      "destination": "LA",
      "pickup_date": "2026-01-15T10:00:00Z",
      "delivery_date": "2026-01-20T16:00:00Z",
      "is_hazmat": false
    }
  ]
}
```

Should select all 3 orders (total $900).

### Hazmat Order

One high-paying hazmat order:

```json
{
  "truck": {
    "id": "TRUCK-002",
    "max_weight_lbs": 10000,
    "max_volume_cuft": 1000
  },
  "orders": [
    {
      "id": "HAZ-001",
      "payout_cents": 100000,
      "weight_lbs": 3000,
      "volume_cuft": 400,
      "origin": "Houston, TX",
      "destination": "Denver, CO",
      "pickup_date": "2026-01-15T08:00:00Z",
      "delivery_date": "2026-01-18T18:00:00Z",
      "is_hazmat": true
    },
    {
      "id": "ORD-002",
      "payout_cents": 25000,
      "weight_lbs": 1500,
      "volume_cuft": 200,
      "origin": "Houston, TX",
      "destination": "Denver, CO",
      "pickup_date": "2026-01-15T08:00:00Z",
      "delivery_date": "2026-01-18T18:00:00Z",
      "is_hazmat": false
    }
  ]
}
```

Should select only the hazmat order ($1,000) because hazmat can't be mixed with regular orders.

### Weight Limit

Orders that exceed capacity when combined:

```json
{
  "truck": {
    "id": "TRUCK-003",
    "max_weight_lbs": 5000,
    "max_volume_cuft": 1000
  },
  "orders": [
    {
      "id": "ORD-001",
      "payout_cents": 50000,
      "weight_lbs": 4000,
      "volume_cuft": 300,
      "origin": "Seattle, WA",
      "destination": "Portland, OR",
      "pickup_date": "2026-01-15T08:00:00Z",
      "delivery_date": "2026-01-16T18:00:00Z",
      "is_hazmat": false
    },
    {
      "id": "ORD-002",
      "payout_cents": 40000,
      "weight_lbs": 3000,
      "volume_cuft": 250,
      "origin": "Seattle, WA",
      "destination": "Portland, OR",
      "pickup_date": "2026-01-15T08:00:00Z",
      "delivery_date": "2026-01-16T18:00:00Z",
      "is_hazmat": false
    }
  ]
}
```

Should select only ORD-001 (can't fit both).

### Different Routes

Orders with different origins/destinations:

```json
{
  "truck": {
    "id": "TRUCK-004",
    "max_weight_lbs": 10000,
    "max_volume_cuft": 1000
  },
  "orders": [
    {
      "id": "ORD-001",
      "payout_cents": 30000,
      "weight_lbs": 2000,
      "volume_cuft": 200,
      "origin": "New York, NY",
      "destination": "Los Angeles, CA",
      "pickup_date": "2026-01-15T08:00:00Z",
      "delivery_date": "2026-01-20T18:00:00Z",
      "is_hazmat": false
    },
    {
      "id": "ORD-002",
      "payout_cents": 40000,
      "weight_lbs": 2500,
      "volume_cuft": 250,
      "origin": "Chicago, IL",
      "destination": "Miami, FL",
      "pickup_date": "2026-01-15T08:00:00Z",
      "delivery_date": "2026-01-20T18:00:00Z",
      "is_hazmat": false
    }
  ]
}
```

Should select only one order (can't combine different routes).

### Validation Error

Too many orders:

```bash
# Create a request with 23 orders (max is 22)
# Should get 400 Bad Request with validation error
```

## Performance Check

Test with different order counts:

```bash
# 5 orders - should be instant (<10ms)
# 10 orders - still fast (<20ms)
# 22 orders - under 200ms
```

## Troubleshooting

**Port already in use:**

```bash
# Kill any process on port 8080
lsof -ti:8080 | xargs kill -9

# Or change port in docker-compose.yml
```

**Container won't start:**

```bash
# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

**API returns 404:**

- Make sure you're using the full path: `/api/v1/load-optimizer/optimize`
- Check server is running: `docker-compose ps`

**Validation errors:**

- Check all required fields are present
- Payout must be integer (not decimal)
- Dates must be ISO 8601 format
- Max 22 orders

## Docker Commands

```bash
# Start
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose up --build

# Remove everything
docker-compose down -v
```

## Health Check

```bash
# Check if API is responding
curl http://localhost:8080/

# Should return something like:
# {"message":"SmartLoad Optimizer API is running"}
```

That's it! The API is pretty simple - one endpoint, send truck + orders, get back optimal selection.
