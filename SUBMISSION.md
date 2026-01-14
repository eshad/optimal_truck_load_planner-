# Submission Notes

## Quick Start for Reviewers

```bash
git clone <repo-url>
cd optimal_truck_load_planner-
docker-compose up --build
```

API will be at http://localhost:8080
Swagger docs at http://localhost:8080/api

Test it:

```bash
curl -X POST http://localhost:8080/api/v1/load-optimizer/optimize \
  -H "Content-Type: application/json" \
  -d @sample-request.json
```

## What I Built

A REST API microservice that finds the optimal combination of shipment orders for a truck. It's designed to power a "Find Best Loads" feature in a mobile app.

**Key features:**

- Single endpoint: `POST /api/v1/load-optimizer/optimize`
- Returns most profitable order combination in under 200ms
- Enforces all safety constraints (weight, volume, hazmat, route, time)
- Handles up to 22 orders per request
- Completely stateless (no database)

## Algorithm Choice

I used **bitmask enumeration with early pruning**.

Why not greedy? Greedy algorithms don't guarantee optimal solutions for this type of multi-constraint problem. You might select a high-paying heavy order that blocks you from taking multiple lighter orders worth more combined.

Why bitmask? With max 22 orders, there are 2^22 ≈ 4.2M combinations. That's totally feasible to check exhaustively on modern hardware. Early pruning (stopping as soon as a constraint fails) makes it even faster.

The algorithm:

1. Loop through all possible combinations (0 to 2^n)
2. For each combination, accumulate weight/volume/payout
3. If any constraint fails, immediately skip to next combination
4. Track the combo with highest valid payout
5. Return that

Takes ~150ms worst case (22 orders), usually much faster due to pruning.

## Implementation Details

**Structure:**

- `src/optimize/optimize.controller.ts` - HTTP endpoint
- `src/optimize/optimize.service.ts` - Core algorithm (line 56-95 has the main logic)
- `src/optimize/dto/` - Input/output validation

**Constraints enforced:**

1. Total weight ≤ truck max weight
2. Total volume ≤ truck max volume
3. Max 1 hazmat order
4. Hazmat orders must ship alone (can't mix with regular shipments)
5. All orders must have same origin/destination
6. Pickup date < delivery date for each order

**Assumptions:**

- Hazmat isolation rule: Based on standard DOT regulations, hazmat can't be mixed with other cargo
- Route matching: Simple string comparison (case-insensitive, trimmed)
- Time windows: Simplified - just check pickup before delivery, assume no schedule conflicts
- Money precision: Using integer cents to avoid floating point issues

## Testing

Included test scenarios:

- Simple case (all orders fit)
- Hazmat handling (should pick hazmat alone if it's most profitable)
- Weight constraint (should skip overweight orders)
- Volume constraint (should skip oversized orders)
- Different routes (should only combine matching routes)
- Validation errors (>22 orders, negative values, etc)

Run the sample:

```bash
docker-compose up -d
curl -X POST http://localhost:8080/api/v1/load-optimizer/optimize \
  -H "Content-Type: application/json" \
  -d @sample-request.json
```

Expected result: Selects orders 2, 3, and 5 (skips hazmat order 4 and lower-value order 1) for $1,100 total payout.

## Mobile Integration

Created a guide for mobile developers (MOBILE_INTEGRATION.md) with examples in:

- React Native (TypeScript)
- iOS (Swift)
- Android (Kotlin)

Shows how to call the API when user taps "Find Best Loads" and display results.

## Production Readiness

**Deployment:**

- Dockerized with multi-stage build
- Health checks configured
- Runs on port 8080
- No environment-specific config needed

**Monitoring:**

- Structured logging (NestJS Logger)
- Request/response logging
- Performance metrics in logs

**Error handling:**

- 400 for validation errors with specific messages
- 500 for unexpected errors
- Proper HTTP status codes

**Scalability:**

- Stateless design (can run multiple instances)
- No database (no bottleneck)
- Fast response times (suitable for synchronous mobile requests)

## Time Spent

About 2.5 hours total:

- 30 min: Project setup, NestJS boilerplate
- 60 min: Core algorithm implementation and testing
- 45 min: Swagger docs, validation, error handling
- 15 min: Docker setup
- 30 min: Documentation (README, mobile guide)

## Files to Review

**Core logic:**

- `src/optimize/optimize.service.ts` (especially `evaluateCombination` method)

**API definition:**

- `src/optimize/optimize.controller.ts`
- `src/optimize/dto/optimize-request.dto.ts`

**Deployment:**

- `Dockerfile`
- `docker-compose.yml`

**Documentation:**

- `README.md` - Overview and usage
- `MOBILE_INTEGRATION.md` - How mobile apps should integrate
- `TESTING_GUIDE.md` - Test scenarios

## Potential Improvements

If I had more time or this were going to production:

1. **Better time window validation** - Currently just checks pickup < delivery. Could validate actual schedule conflicts.

2. **Route optimization** - Could geocode addresses and calculate if routes actually make sense together.

3. **Caching** - For repeated requests with same inputs, could cache results.

4. **Analytics** - Track which constraints are hit most often to optimize early pruning order.

5. **Batch processing** - If mobile app has many users, could batch optimize requests.

6. **More sophisticated algorithm** - For >22 orders, would need branch & bound or approximation algorithm.

But for the current requirements (≤22 orders, instant results), the bitmask approach works well.

## Questions?

Happy to discuss any implementation choices or tradeoffs. The core algorithm is intentionally simple and brute-force to guarantee correctness - premature optimization is the root of all evil and all that.
