import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from './dto';
import { RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('OrderServices')

  async onModuleInit() {
    await this.$connect()
    this.logger.log(`Database connected`)
  }
  create(createOrderDto: CreateOrderDto) {
    return this.order.create({ data: createOrderDto })
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit, status } = paginationDto
    const totalCount = await this.order.count({ where: { status } })
    const lastPage = Math.ceil(totalCount / limit)
    const data = await this.order.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: { status }
    });
    return {
      data,
      meta: {
        total: totalCount,
        page, lastPage
      }
    }
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({ where: { id } })
    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`
      })
    }
    return order
  }

  async changeOrderStatus(changeOrderStatus: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatus
    const order = await this.findOne(id)
    if (order.status === status) {
      return order
    }
    return this.order.update({ where: { id }, data: { status } });
  }

}
