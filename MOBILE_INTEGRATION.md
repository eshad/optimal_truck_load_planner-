# Mobile App Integration Guide

## Overview

This document explains how the **mobile app** integrates with the SmartLoad optimization microservice to provide carriers with instant load recommendations.

---

## User Flow

```
Carrier opens mobile app
    ↓
Taps "Find Best Loads" button
    ↓
App sends truck specs + available orders to API
    ↓
API returns optimal combination in <200ms
    ↓
App displays recommended loads with total payout
```

---

## API Integration

### Endpoint

```
POST http://your-api-host:8080/api/v1/load-optimizer/optimize
Content-Type: application/json
```

### Request Format

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

### Response Format

```json
{
  "truck_id": "TRUCK-001",
  "selected_order_ids": ["ORD-002", "ORD-003"],
  "total_payout_cents": 75000,
  "total_weight_lbs": 6500,
  "total_volume_cuft": 750,
  "utilization_weight_percent": 65.0,
  "utilization_volume_percent": 75.0
}
```

---

## Mobile Implementation Examples

### React Native (TypeScript)

```typescript
import axios from 'axios';

interface Truck {
  id: string;
  max_weight_lbs: number;
  max_volume_cuft: number;
}

interface Order {
  id: string;
  payout_cents: number;
  weight_lbs: number;
  volume_cuft: number;
  origin: string;
  destination: string;
  pickup_date: string;
  delivery_date: string;
  is_hazmat: boolean;
}

interface OptimizationResult {
  truck_id: string;
  selected_order_ids: string[];
  total_payout_cents: number;
  total_weight_lbs: number;
  total_volume_cuft: number;
  utilization_weight_percent: number;
  utilization_volume_percent: number;
}

const API_BASE_URL = 'http://your-api-host:8080';

async function findBestLoads(
  truck: Truck,
  availableOrders: Order[]
): Promise<OptimizationResult> {
  try {
    const response = await axios.post<OptimizationResult>(
      `${API_BASE_URL}/api/v1/load-optimizer/optimize`,
      {
        truck,
        orders: availableOrders,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 second timeout
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        throw new Error('Invalid input: ' + error.response.data.message);
      }
      throw new Error('Network error. Please try again.');
    }
    throw error;
  }
}

// Usage in component
function SmartLoadScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const handleFindBestLoads = async () => {
    setLoading(true);
    try {
      const truck = getUserTruck(); // Get from user profile
      const orders = await fetchAvailableOrders(); // Get from backend

      const optimization = await findBestLoads(truck, orders);
      setResult(optimization);

      // Display result to user
      const payoutDollars = optimization.total_payout_cents / 100;
      alert(`Best load found: $${payoutDollars} with ${optimization.selected_order_ids.length} orders`);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button
        title={loading ? "Finding Best Loads..." : "Find Best Loads"}
        onPress={handleFindBestLoads}
        disabled={loading}
      />
      {result && (
        <View>
          <Text>💰 Total Payout: ${result.total_payout_cents / 100}</Text>
          <Text>📦 Orders: {result.selected_order_ids.length}</Text>
          <Text>⚖️ Weight: {result.utilization_weight_percent.toFixed(0)}% capacity</Text>
          <Text>📐 Volume: {result.utilization_volume_percent.toFixed(0)}% capacity</Text>
        </View>
      )}
    </View>
  );
}
```

### Swift (iOS)

```swift
import Foundation

struct Truck: Codable {
    let id: String
    let max_weight_lbs: Double
    let max_volume_cuft: Double
}

struct Order: Codable {
    let id: String
    let payout_cents: Int
    let weight_lbs: Double
    let volume_cuft: Double
    let origin: String
    let destination: String
    let pickup_date: String
    let delivery_date: String
    let is_hazmat: Bool
}

struct OptimizationRequest: Codable {
    let truck: Truck
    let orders: [Order]
}

struct OptimizationResult: Codable {
    let truck_id: String
    let selected_order_ids: [String]
    let total_payout_cents: Int
    let total_weight_lbs: Double
    let total_volume_cuft: Double
    let utilization_weight_percent: Double
    let utilization_volume_percent: Double
}

class SmartLoadService {
    private let baseURL = "http://your-api-host:8080"

    func findBestLoads(truck: Truck, orders: [Order]) async throws -> OptimizationResult {
        let url = URL(string: "\(baseURL)/api/v1/load-optimizer/optimize")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 5.0

        let requestBody = OptimizationRequest(truck: truck, orders: orders)
        request.httpBody = try JSONEncoder().encode(requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "Invalid response", code: -1)
        }

        if httpResponse.statusCode == 400 {
            throw NSError(domain: "Invalid input", code: 400)
        }

        guard httpResponse.statusCode == 200 || httpResponse.statusCode == 201 else {
            throw NSError(domain: "API Error", code: httpResponse.statusCode)
        }

        return try JSONDecoder().decode(OptimizationResult.self, from: data)
    }
}

// Usage in ViewController
func onFindBestLoadsButtonTapped() {
    Task {
        do {
            let truck = getUserTruck()
            let orders = await fetchAvailableOrders()

            let result = try await SmartLoadService().findBestLoads(truck: truck, orders: orders)

            let payoutDollars = Double(result.total_payout_cents) / 100.0
            let message = "Best load: $\(payoutDollars) with \(result.selected_order_ids.count) orders"

            await MainActor.run {
                showAlert(title: "SmartLoad", message: message)
            }
        } catch {
            await MainActor.run {
                showAlert(title: "Error", message: error.localizedDescription)
            }
        }
    }
}
```

### Kotlin (Android)

```kotlin
import kotlinx.coroutines.*
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST

data class Truck(
    val id: String,
    val max_weight_lbs: Double,
    val max_volume_cuft: Double
)

data class Order(
    val id: String,
    val payout_cents: Int,
    val weight_lbs: Double,
    val volume_cuft: Double,
    val origin: String,
    val destination: String,
    val pickup_date: String,
    val delivery_date: String,
    val is_hazmat: Boolean
)

data class OptimizationRequest(
    val truck: Truck,
    val orders: List<Order>
)

data class OptimizationResult(
    val truck_id: String,
    val selected_order_ids: List<String>,
    val total_payout_cents: Int,
    val total_weight_lbs: Double,
    val total_volume_cuft: Double,
    val utilization_weight_percent: Double,
    val utilization_volume_percent: Double
)

interface SmartLoadApi {
    @POST("/api/v1/load-optimizer/optimize")
    suspend fun optimize(@Body request: OptimizationRequest): OptimizationResult
}

class SmartLoadService {
    private val retrofit = Retrofit.Builder()
        .baseUrl("http://your-api-host:8080")
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val api = retrofit.create(SmartLoadApi::class.java)

    suspend fun findBestLoads(truck: Truck, orders: List<Order>): OptimizationResult {
        return api.optimize(OptimizationRequest(truck, orders))
    }
}

// Usage in Activity/Fragment
class SmartLoadActivity : AppCompatActivity() {
    private val service = SmartLoadService()

    fun onFindBestLoadsClick() {
        lifecycleScope.launch {
            try {
                val truck = getUserTruck()
                val orders = fetchAvailableOrders()

                val result = service.findBestLoads(truck, orders)

                val payoutDollars = result.total_payout_cents / 100.0
                val message = "Best load: $${payoutDollars} with ${result.selected_order_ids.size} orders"

                Toast.makeText(this@SmartLoadActivity, message, Toast.LENGTH_LONG).show()
            } catch (e: Exception) {
                Toast.makeText(this@SmartLoadActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
}
```

---

## Error Handling

### HTTP Status Codes

| Code    | Meaning             | Action                                 |
| ------- | ------------------- | -------------------------------------- |
| 200/201 | Success             | Display results to user                |
| 400     | Validation error    | Show specific validation message       |
| 500     | Server error        | Show generic error, retry              |
| 503     | Service unavailable | Show "Service temporarily unavailable" |

### Validation Errors Example

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

**Mobile handling:**

```typescript
if (error.response?.status === 400) {
  const messages = error.response.data.message;
  showAlert('Invalid Input', messages.join('\n'));
}
```

---

## Performance Expectations

| Orders | Response Time | Recommendation              |
| ------ | ------------- | --------------------------- |
| 1-10   | <50ms         | No loading indicator needed |
| 11-18  | <100ms        | Brief loading indicator     |
| 19-22  | <200ms        | Show loading spinner        |

**Recommended timeout:** 5 seconds (to account for network latency)

---

## UI/UX Recommendations

### Loading State

```
[Button: Finding Best Loads...]
⏳ Analyzing 15 available shipments...
```

### Success State

```
✅ Best Load Found!

💰 Total Payout: $1,100.00
📦 Selected Orders: 3
   • ORD-002: $300.00
   • ORD-003: $450.00
   • ORD-005: $350.00

⚖️ Weight Capacity: 75% (7,500 / 10,000 lbs)
📐 Volume Capacity: 83% (830 / 1,000 cu.ft)

[Accept This Load] [View Details]
```

### Error State

```
❌ Unable to find optimal load

Reason: All available orders exceed your truck's capacity

[Try Again] [Adjust Truck Settings]
```

---

## Testing the Integration

### Sample Test Data

```typescript
const testTruck: Truck = {
  id: 'TEST-TRUCK-001',
  max_weight_lbs: 10000,
  max_volume_cuft: 1000,
};

const testOrders: Order[] = [
  {
    id: 'TEST-ORD-001',
    payout_cents: 50000,
    weight_lbs: 2000,
    volume_cuft: 300,
    origin: 'New York, NY',
    destination: 'Los Angeles, CA',
    pickup_date: new Date('2026-01-15T08:00:00Z').toISOString(),
    delivery_date: new Date('2026-01-20T18:00:00Z').toISOString(),
    is_hazmat: false,
  },
];
```

### Using Swagger for Testing

Before mobile integration, test the API manually:

1. Open: `http://your-api-host:8080/api`
2. Click on `POST /api/v1/load-optimizer/optimize`
3. Click "Try it out"
4. Paste test data
5. Click "Execute"
6. Verify response

---

## Security Considerations

### API Authentication (Future Enhancement)

```typescript
// Add JWT token to requests
const response = await axios.post(
  `${API_BASE_URL}/api/v1/load-optimizer/optimize`,
  requestBody,
  {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
  },
);
```

### Data Validation

Always validate user input before sending:

```typescript
if (orders.length > 22) {
  throw new Error('Maximum 22 orders allowed');
}

if (truck.max_weight_lbs <= 0) {
  throw new Error('Invalid truck capacity');
}
```

---

## Deployment

### Production API URL

Replace development URL with production:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost:8080'
  : 'https://api.teleport.com'; // Production URL
```

### Environment Configuration

```typescript
// config.ts
export const API_CONFIG = {
  development: 'http://localhost:8080',
  staging: 'https://staging-api.teleport.com',
  production: 'https://api.teleport.com',
};
```

---

## Support & Contact

For API issues or questions:

- **API Documentation:** `http://your-api-host:8080/api`
- **Health Check:** `GET http://your-api-host:8080/`
- **Backend Team:** backend-team@teleport.com

---

## Quick Reference

**API Endpoint:**

```
POST /api/v1/load-optimizer/optimize
```

**Max Orders:** 22

**Expected Response Time:** <200ms

**Timeout Recommendation:** 5 seconds

**Payout Format:** Integer cents (divide by 100 for dollars)

**Date Format:** ISO 8601 (e.g., "2026-01-15T08:00:00Z")
