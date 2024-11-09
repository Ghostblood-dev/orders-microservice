import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NAST_SERVICES, PRODUCT_SERVICES } from 'src/config/services';
import { envs } from 'src/config/envs';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    ClientsModule.register([
      {
        name: NAST_SERVICES,
        transport: Transport.NATS,
        options: {
           servers: envs.natsServers
        }
      },
    ]),
  ],
})
export class OrdersModule { }
