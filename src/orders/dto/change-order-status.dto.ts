import { IsUUID, IsEnum } from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';
import { OrderStatus } from '@prisma/client';

export class ChangeOrderStatusDto {
    
    @IsUUID()
    id: string

    @IsEnum(OrderStatusList,{
        message:`Valid status are ${OrderStatusList}`
    })
    status:OrderStatus
}