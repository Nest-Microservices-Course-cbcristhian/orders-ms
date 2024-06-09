import { ArrayMinSize, IsArray, ValidateNested } from "class-validator"
import { OrderItemDto } from './order-item.dto';
import { Type } from 'class-transformer';

export class CreateOrderDto {

/*     @IsNumber()
    @IsPositive()
    totalAmount:number 

    @IsNumber()
    @IsPositive()
    totalItems:number
    
    @IsEnum(OrderStatusList,{message:`Possible values are ${OrderStatusList}`})
    @IsOptional()
    status:OrderStatus=OrderStatus.PENDING 

    @IsOptional()
    @IsBoolean()
    paid: boolean=false
 */

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({each:true})
    @Type(()=>OrderItemDto)
    items:OrderItemDto[]
}

