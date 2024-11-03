import { OrderStatus } from "@prisma/client";

export const OrderStatusList = [
    OrderStatus.CANCEL,
    OrderStatus.DELIVERY,
    OrderStatus.PENDING,
]