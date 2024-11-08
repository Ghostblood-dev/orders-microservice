import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from './dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto } from './dto';
import { PRODUCT_SERVICES } from 'src/config/services';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('OrderServices')

  constructor(@Inject(PRODUCT_SERVICES) private readonly productClient: ClientProxy) {
    super();
  }

  async onModuleInit() {
    await this.$connect()
    this.logger.log(`Database connected`)
  }
  async create(createOrderDto: CreateOrderDto) {
    try {
      //1 - Confirmar los ids de los products
      const productsIds = createOrderDto.items.map(item => (item.productId))

      const products = await firstValueFrom(
        this.productClient.send({ cmd: 'validate_products' }, productsIds)
      )

      //2 - Calculo de los valores
      const totalAmount = createOrderDto.items.reduce((acc, item) => {
        const { price } = products.find(product => product.id === item.productId)
        const totalPrice = price * item.quantity
        return acc + totalPrice
      }, 0)
      const totalItems = createOrderDto.items.reduce((acc, item) => acc + item.quantity, 0)

      //3 - Crear una transaccion en base de datos
      const ordenItems = createOrderDto.items.map(item => ({
        price: products.find(product => product.id === item.productId).price,
        productId: item.productId,
        quantity: item.quantity
      }))

      const order = await this.order.create({
        data: {
          totalAmount,
          totalItems,
          OrdenItem: {
            createMany: {
              data: ordenItems
            }
          }
        },
        include: {
          OrdenItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            }
          },
        }
      })

      const { OrdenItem, ...resOrder } = order
      return {
        ...resOrder,
        OrdenItem: OrdenItem.map(orderItem => ({
          ...orderItem,
          name: products.find(product => product.id === orderItem.productId).name
        }))
      }
    } catch (error) {
      // console.log(error)
      throw new RpcException(error)
    }
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
    const order = await this.order.findFirst({
      where: { id },
      include: {
        OrdenItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          }
        },
      }
    })
    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`
      })
    }

    // const ordersItemsIds = orderItems.map(item => item.productId)
    const { OrdenItem, ...resData } = order
    const ordersItemsIds = OrdenItem.map(item => item.productId)
    const products = await firstValueFrom(
      this.productClient.send({ cmd: 'validate_products' }, ordersItemsIds)
    )
    return {
      ...resData, OrdenItem: OrdenItem.map(item => ({
        ...item,
        name: products.find(product => product.id === item.productId).name
      }))
    }
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
