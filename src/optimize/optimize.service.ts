import { Injectable, Logger } from '@nestjs/common';
import { OptimizeRequestDto, OrderDto } from './dto/optimize-request.dto';
import { OptimizeResponseDto } from './dto/optimize-response.dto';

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

@Injectable()
export class OptimizeService {
  private readonly logger = new Logger(OptimizeService.name);

  /**
   * Main optimization method using bitmask enumeration with early pruning
   * Finds the optimal combination of orders that maximizes payout while respecting all constraints
   */
  optimize(request: OptimizeRequestDto): OptimizeResponseDto {
    this.logger.log(
      `Starting optimization for truck ${request.truck.id} with ${request.orders.length} orders`,
    );

    const { truck, orders } = request;
    const n = orders.length;

    // Edge case: no orders
    if (n === 0) {
      return this.buildResponse(truck.id, [], orders, truck);
    }

    // Edge case: single order - check if it fits
    if (n === 1) {
      const order = orders[0];
      if (this.validateSingleOrder(order, truck).valid) {
        return this.buildResponse(truck.id, [0], orders, truck);
      }
      return this.buildResponse(truck.id, [], orders, truck);
    }

    let bestPayout = 0;
    let bestMask = 0;

    const totalCombinations = 1 << n; // 2^n combinations

    this.logger.log(`Evaluating ${totalCombinations} possible combinations`);

    // Bitmask enumeration: iterate through all subsets
    for (let mask = 0; mask < totalCombinations; mask++) {
      const evaluation = this.evaluateCombination(mask, orders, truck);

      if (evaluation.valid && evaluation.payout > bestPayout) {
        bestPayout = evaluation.payout;
        bestMask = mask;
      }
    }

    // Extract selected order indices from best mask
    const selectedIndices: number[] = [];
    for (let i = 0; i < n; i++) {
      if (bestMask & (1 << i)) {
        selectedIndices.push(i);
      }
    }

    this.logger.log(
      `Optimization complete. Selected ${selectedIndices.length} orders with total payout: $${bestPayout / 100}`,
    );

    return this.buildResponse(truck.id, selectedIndices, orders, truck);
  }

  /**
   * Evaluates a specific combination represented by a bitmask
   * Returns validity status and total payout
   * Uses early pruning to stop evaluation as soon as a constraint is violated
   */
  private evaluateCombination(
    mask: number,
    orders: OrderDto[],
    truck: { max_weight_lbs: number; max_volume_cuft: number },
  ): { valid: boolean; payout: number } {
    let totalWeight = 0;
    let totalVolume = 0;
    let totalPayout = 0;
    let hazmatCount = 0;
    const selectedOrders: OrderDto[] = [];

    // Extract orders in this combination
    for (let i = 0; i < orders.length; i++) {
      if (mask & (1 << i)) {
        const order = orders[i];
        selectedOrders.push(order);

        // Accumulate metrics
        totalWeight += order.weight_lbs;
        totalVolume += order.volume_cuft;
        totalPayout += order.payout_cents;

        if (order.is_hazmat) {
          hazmatCount++;
        }

        // Early pruning: stop if constraints violated
        if (totalWeight > truck.max_weight_lbs) {
          return { valid: false, payout: 0 };
        }

        if (totalVolume > truck.max_volume_cuft) {
          return { valid: false, payout: 0 };
        }

        // Hazmat constraint: max 1 hazmat order
        if (hazmatCount > 1) {
          return { valid: false, payout: 0 };
        }
      }
    }

    // If no orders selected, it's technically valid but has zero payout
    if (selectedOrders.length === 0) {
      return { valid: true, payout: 0 };
    }

    // Hazmat isolation rule: if hazmat exists, must be alone
    if (hazmatCount === 1 && selectedOrders.length > 1) {
      return { valid: false, payout: 0 };
    }

    // Route consistency: all orders must have same origin and destination
    if (!this.validateRouteConsistency(selectedOrders)) {
      return { valid: false, payout: 0 };
    }

    // Time window validation: pickup must be before delivery
    if (!this.validateTimeWindows(selectedOrders)) {
      return { valid: false, payout: 0 };
    }

    return { valid: true, payout: totalPayout };
  }

  /**
   * Validates a single order against truck constraints
   */
  private validateSingleOrder(
    order: OrderDto,
    truck: { max_weight_lbs: number; max_volume_cuft: number },
  ): ValidationResult {
    if (order.weight_lbs > truck.max_weight_lbs) {
      return { valid: false, reason: 'Weight exceeds capacity' };
    }

    if (order.volume_cuft > truck.max_volume_cuft) {
      return { valid: false, reason: 'Volume exceeds capacity' };
    }

    const pickupDate = new Date(order.pickup_date);
    const deliveryDate = new Date(order.delivery_date);

    if (pickupDate >= deliveryDate) {
      return { valid: false, reason: 'Pickup date must be before delivery' };
    }

    return { valid: true };
  }

  /**
   * Validates that all orders share the same origin and destination
   */
  private validateRouteConsistency(orders: OrderDto[]): boolean {
    if (orders.length === 0) return true;

    const firstOrder = orders[0];
    const origin = firstOrder.origin.trim().toLowerCase();
    const destination = firstOrder.destination.trim().toLowerCase();

    for (const order of orders) {
      if (
        order.origin.trim().toLowerCase() !== origin ||
        order.destination.trim().toLowerCase() !== destination
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validates time windows for all orders
   * Ensures pickup_date < delivery_date for each order
   * Checks for no overlapping conflicts (simplified assumption: same route orders are compatible)
   */
  private validateTimeWindows(orders: OrderDto[]): boolean {
    for (const order of orders) {
      const pickupDate = new Date(order.pickup_date);
      const deliveryDate = new Date(order.delivery_date);

      if (pickupDate >= deliveryDate) {
        return false;
      }

      // Basic validation: ensure valid dates
      if (isNaN(pickupDate.getTime()) || isNaN(deliveryDate.getTime())) {
        return false;
      }
    }

    // Simplified assumption: orders on same route with valid windows don't conflict
    // In a real system, you'd check for pickup/delivery time conflicts
    return true;
  }

  /**
   * Builds the response DTO from selected order indices
   */
  private buildResponse(
    truckId: string,
    selectedIndices: number[],
    orders: OrderDto[],
    truck: { max_weight_lbs: number; max_volume_cuft: number },
  ): OptimizeResponseDto {
    let totalWeight = 0;
    let totalVolume = 0;
    let totalPayout = 0;
    const selectedOrderIds: string[] = [];

    for (const index of selectedIndices) {
      const order = orders[index];
      selectedOrderIds.push(order.id);
      totalWeight += order.weight_lbs;
      totalVolume += order.volume_cuft;
      totalPayout += order.payout_cents;
    }

    const utilizationWeight =
      truck.max_weight_lbs > 0 ? (totalWeight / truck.max_weight_lbs) * 100 : 0;

    const utilizationVolume =
      truck.max_volume_cuft > 0
        ? (totalVolume / truck.max_volume_cuft) * 100
        : 0;

    return {
      truck_id: truckId,
      selected_order_ids: selectedOrderIds,
      total_payout_cents: Math.round(totalPayout), // Ensure integer
      total_weight_lbs: Math.round(totalWeight * 100) / 100, // Round to 2 decimals
      total_volume_cuft: Math.round(totalVolume * 100) / 100, // Round to 2 decimals
      utilization_weight_percent: Math.round(utilizationWeight * 100) / 100,
      utilization_volume_percent: Math.round(utilizationVolume * 100) / 100,
    };
  }
}
