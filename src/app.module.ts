import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItemsModule } from './items/items.module';
import { OptimizeController } from './optimize/optimize.controller';
import { OptimizeService } from './optimize/optimize.service';

@Module({
  imports: [ItemsModule],
  controllers: [AppController, OptimizeController],
  providers: [AppService, OptimizeService],
})
export class AppModule {}
