# SmartLoad Optimizer - Testing Guide

This guide provides step-by-step instructions to test the Optimal Truck Load Planner API.

---

## Quick Start

### 1. Run with Docker (Recommended)

```bash
# Build and start the container
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### 2. Run Locally (Development)

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run start:dev

# Or build and run in production mode
npm run build
npm run start:prod
```

---

## Testing the API

### Method 1: Using cURL

**Test with sample request:**

```bash
curl -X POST http://localhost:8080/api/v1/load-optimizer/optimize \
  -H "Content-Type: application/json" \
  -d @sample-request.json
```

**Manual test:**

```bash
curl -X POST http://localhost:8080/api/v1/load-optimizer/optimize \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### Method 2: Using Swagger UI

1. Open browser to: http://localhost:8080/api
2. Expand the **POST /api/v1/load-optimizer/optimize** endpoint
3. Click **"Try it out"**
4. Modify the request body or use the default
5. Click **"Execute"**
6. View the response below

### Method 3: Using Postman

1. Create new POST request
2. URL: `http://localhost:8080/api/v1/load-optimizer/optimize`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON): Use sample request from `sample-request.json`
5. Send request

---

## Expected Response

**Success (200 OK):**

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

**Validation Error (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": ["orders must contain no more than 22 elements"],
  "error": "Bad Request"
}
```

---

## Test Scenarios

### Scenario 1: Simple Valid Request

**Description:** 3 non-hazmat orders, all fit in truck

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

**Expected:** Selects all 3 orders (total: $900)

---

### Scenario 2: Hazmat Order (Must Be Alone)

**Description:** 1 hazmat order with high payout

```json
{
  "truck": {
    "id": "TRUCK-002",
    "max_weight_lbs": 10000,
    "max_volume_cuft": 1000
  },
  "orders": [
    {
      "id": "ORD-HAZ-001",
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

**Expected:** Selects only the hazmat order (total: $1,000)

---

### Scenario 3: Weight Constraint Violation

**Description:** Orders exceed truck capacity

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

**Expected:** Selects only ORD-001 (4000 lbs, $500)

---

### Scenario 4: Different Routes (Should Reject)

**Description:** Orders with different origins/destinations

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

**Expected:** Selects only 1 order (cannot combine different routes)

---

### Scenario 5: Validation Error - Too Many Orders

```bash
# This should fail validation
curl -X POST http://localhost:8080/api/v1/load-optimizer/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "truck": {"id": "T1", "max_weight_lbs": 10000, "max_volume_cuft": 1000},
    "orders": [... 23 orders ...]
  }'
```

**Expected:** 400 Bad Request with validation error

---

## Verify Docker Health

```bash
# Check container status
docker-compose ps

# Check health status
docker inspect smartload-optimizer-api --format='{{.State.Health.Status}}'

# View container logs
docker-compose logs -f
```

---

## Performance Testing

Test with maximum orders (22):

```bash
# Generate test with 22 orders
# Algorithm should complete in < 500ms

time curl -X POST http://localhost:8080/api/v1/load-optimizer/optimize \
  -H "Content-Type: application/json" \
  -d @large-request.json
```

---

## Troubleshooting

### Port Already in Use

```bash
# Stop any running instance
docker-compose down
pkill -f "node dist/main"

# Check what's using port 8080
lsof -i :8080
```

### Container Won't Start

```bash
# View detailed logs
docker-compose logs --tail=100

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

### API Returns 404

- Verify correct endpoint: `/api/v1/load-optimizer/optimize`
- Check container is running: `docker-compose ps`
- View logs: `docker-compose logs`

---

## API Endpoints Summary

| Endpoint                          | Method | Description                |
| --------------------------------- | ------ | -------------------------- |
| `/api`                            | GET    | Swagger UI documentation   |
| `/api-json`                       | GET    | OpenAPI JSON specification |
| `/api/v1/load-optimizer/optimize` | POST   | Main optimization endpoint |

---

## Clean Up

```bash
# Stop containers
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# Remove built images
docker rmi optimal_truck_load_planner-smartload-optimizer
```

---

## Success Criteria

- [ ] Server starts on port 8080
- [ ] Swagger UI accessible at http://localhost:8080/api
- [ ] POST endpoint accepts valid requests
- [ ] Response includes optimal order selection
- [ ] Validation rejects invalid inputs
- [ ] Hazmat rules enforced correctly
- [ ] Route consistency validated
- [ ] Container health checks pass

---

**For more information, see the main [README.md](./README.md)**
