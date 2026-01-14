import { ApiProperty } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ example: 'Sample Item', description: 'The name of the item' })
  name: string;

  @ApiProperty({ example: 'This is a sample item', description: 'The description of the item' })
  description: string;

  @ApiProperty({ example: 29.99, description: 'The price of the item' })
  price: number;
}
