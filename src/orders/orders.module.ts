import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs } from 'src/config';
import { PRODUCT_SERVICE } from 'src/config/services';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    ClientsModule.register([
      { 
        name: PRODUCT_SERVICE, 
        transport: Transport.TCP,
        options:{
          host: envs.productMsHost,
          port: envs.productMsPort
        } 
      },
    ]),
  ]
})
export class OrdersModule {}
