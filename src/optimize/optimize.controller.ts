import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { OptimizeService } from './optimize.service';
import { OptimizeRequestDto } from './dto/optimize-request.dto';
import { OptimizeResponseDto } from './dto/optimize-response.dto';

@ApiTags('Load Optimizer')
@Controller('api/v1/load-optimizer')
export class OptimizeController {
  constructor(private readonly optimizeService: OptimizeService) {}

  @Post('optimize')
  @ApiOperation({
    summary: 'Optimize truck load selection',
    description:
      'Selects the optimal combination of shipment orders for a truck to maximize payout while respecting weight, volume, hazmat, route, and time constraints. Uses bitmask enumeration with early pruning algorithm.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully calculated optimal load configuration',
    type: OptimizeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data (validation failed)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'orders must contain no more than 22 elements',
            'truck.max_weight_lbs must not be less than 0',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  optimize(@Body() request: OptimizeRequestDto): OptimizeResponseDto {
    return this.optimizeService.optimize(request);
  }
}
