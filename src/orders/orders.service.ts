import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger= new Logger('OrdersService')

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database Connected')
  }

  create(createOrderDto: CreateOrderDto) {
    return this.order.create({data:createOrderDto})
  }

  findAll() {
    return this.order.findMany();
  }

  async findOne(id: string) {

    const order = await this.order.findFirst({
      where:{id}
    });

    if(!order){
      throw new RpcException({
        status:HttpStatus.NOT_FOUND,
        message:`Order with id: ${id} not found`
      })
    }
    return order
  }

  async changeStatus(changeOrderStatus:ChangeOrderStatusDto){
    const {id,status}=changeOrderStatus

    const order= await this.findOne(id)
    if(order.status===status) return order

    return this.order.update({
      where:{id},
      data:{status}
    })
  }
}
