import { Controller, NotImplementedException, ParseUUIDPipe } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { PaidOrderDto } from './dto/paid-order.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order= await this.ordersService.create(createOrderDto);
    const paymentSession= await this.ordersService.createPaymentSession(order)
    return{ order, paymentSession }
  }

  @MessagePattern('findAllOrders')
  findAll() {
    return this.ordersService.findAll();
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload('id',ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('changeOrderStatus')
  changeOrderStatus(@Payload()changeOrderStatus:ChangeOrderStatusDto){
    return this.ordersService.changeStatus(changeOrderStatus)  
  }

  @EventPattern('payment.succeeded')
  paidOrder(@Payload()paidOrderDto:PaidOrderDto){
    return this.ordersService.paidOrder(paidOrderDto)
  }

}
