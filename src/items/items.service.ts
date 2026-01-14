import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { Item } from './item.entity';

@Injectable()
export class ItemsService {
  private items: Item[] = [
    {
      id: '1',
      name: 'Sample Item',
      description: 'This is a sample item',
      price: 29.99,
      createdAt: new Date(),
    },
  ];

  findAll(): Item[] {
    return this.items;
  }

  findOne(id: string): Item {
    const item = this.items.find((item) => item.id === id);
    if (!item) {
      throw new NotFoundException(`Item with ID "${id}" not found`);
    }
    return item;
  }

  create(createItemDto: CreateItemDto): Item {
    const newItem: Item = {
      id: Date.now().toString(),
      ...createItemDto,
      createdAt: new Date(),
    };
    this.items.push(newItem);
    return newItem;
  }

  remove(id: string): void {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Item with ID "${id}" not found`);
    }
    this.items.splice(index, 1);
  }
}
