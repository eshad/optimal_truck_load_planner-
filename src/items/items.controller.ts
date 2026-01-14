import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { Item } from './item.entity';

@ApiTags('items')
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all items' })
  @ApiResponse({ status: 200, description: 'Return all items.' })
  findAll(): Item[] {
    return this.itemsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by id' })
  @ApiResponse({ status: 200, description: 'Return the item.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  findOne(@Param('id') id: string): Item {
    return this.itemsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({ status: 201, description: 'The item has been created.' })
  create(@Body() createItemDto: CreateItemDto): Item {
    return this.itemsService.create(createItemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an item' })
  @ApiResponse({ status: 200, description: 'The item has been deleted.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  remove(@Param('id') id: string): void {
    return this.itemsService.remove(id);
  }
}
