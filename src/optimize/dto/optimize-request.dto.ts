import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  IsInt,
  IsDateString,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderDto {
  @ApiProperty({
    description: 'Unique order identifier',
    example: 'ORD-001',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Payout in cents (integer only)',
    example: 25000,
    type: 'integer',
  })
  @IsInt()
  @Min(0)
  payout_cents: number;

  @ApiProperty({
    description: 'Weight in pounds',
    example: 1500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  weight_lbs: number;

  @ApiProperty({
    description: 'Volume in cubic feet',
    example: 200,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  volume_cuft: number;

  @ApiProperty({
    description: 'Origin location',
    example: 'New York, NY',
  })
  @IsString()
  origin: string;

  @ApiProperty({
    description: 'Destination location',
    example: 'Los Angeles, CA',
  })
  @IsString()
  destination: string;

  @ApiProperty({
    description: 'Pickup date in ISO 8601 format',
    example: '2026-01-15T08:00:00Z',
  })
  @IsDateString()
  pickup_date: string;

  @ApiProperty({
    description: 'Delivery date in ISO 8601 format',
    example: '2026-01-20T18:00:00Z',
  })
  @IsDateString()
  delivery_date: string;

  @ApiProperty({
    description: 'Whether the order contains hazardous materials',
    example: false,
  })
  @IsBoolean()
  is_hazmat: boolean;
}

export class TruckDto {
  @ApiProperty({
    description: 'Unique truck identifier',
    example: 'TRUCK-A1',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Maximum weight capacity in pounds',
    example: 10000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  max_weight_lbs: number;

  @ApiProperty({
    description: 'Maximum volume capacity in cubic feet',
    example: 1000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  max_volume_cuft: number;
}

export class OptimizeRequestDto {
  @ApiProperty({
    description: 'Truck configuration',
    type: TruckDto,
  })
  @ValidateNested()
  @Type(() => TruckDto)
  truck: TruckDto;

  @ApiProperty({
    description: 'Array of available orders (maximum 22 orders)',
    type: [OrderDto],
    maxItems: 22,
  })
  @IsArray()
  @ArrayMaxSize(22, {
    message: 'Maximum 22 orders allowed for optimal performance',
  })
  @ValidateNested({ each: true })
  @Type(() => OrderDto)
  orders: OrderDto[];
}
