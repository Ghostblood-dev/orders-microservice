import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PRODUCT_SERVICES } from 'src/config/services';
import { envs } from 'src/config/envs';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    ClientsModule.register([
      {
        name: PRODUCT_SERVICES,
        transport: Transport.TCP,
        options: {
          host: envs.productHost,
          port: envs.productPort
        }
      },
    ]),
  ],
})
export class OrdersModule { }
