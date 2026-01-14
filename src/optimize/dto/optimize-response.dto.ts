import { ApiProperty } from '@nestjs/swagger';

export class OptimizeResponseDto {
  @ApiProperty({
    description: 'Truck identifier from request',
    example: 'TRUCK-A1',
  })
  truck_id: string;

  @ApiProperty({
    description: 'Array of selected order IDs',
    example: ['ORD-001', 'ORD-003', 'ORD-005'],
    type: [String],
  })
  selected_order_ids: string[];

  @ApiProperty({
    description: 'Total payout in cents (integer)',
    example: 75000,
    type: 'integer',
  })
  total_payout_cents: number;

  @ApiProperty({
    description: 'Total weight in pounds',
    example: 8500,
  })
  total_weight_lbs: number;

  @ApiProperty({
    description: 'Total volume in cubic feet',
    example: 850,
  })
  total_volume_cuft: number;

  @ApiProperty({
    description: 'Weight utilization percentage',
    example: 85.0,
  })
  utilization_weight_percent: number;

  @ApiProperty({
    description: 'Volume utilization percentage',
    example: 85.0,
  })
  utilization_volume_percent: number;
}
