import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OptimizeController } from './optimize/optimize.controller';
import { OptimizeService } from './optimize/optimize.service';

@Module({
  imports: [],
  controllers: [AppController, OptimizeController],
  providers: [AppService, OptimizeService],
})
export class AppModule {}
