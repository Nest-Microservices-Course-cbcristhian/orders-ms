import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { PRODUCT_SERVICE } from '../config/services';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger= new Logger('OrdersService')

  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productsClient:ClientProxy
  ){
    super()
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Orders Database Connected')
  }

  async create(createOrderDto: CreateOrderDto) {

    const products= await firstValueFrom(
      this.productsClient.send({cmd:'validate_products'},[5,6])
    )
    return products
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
