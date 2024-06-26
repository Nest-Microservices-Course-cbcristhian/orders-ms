import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { NATS_SERVICE } from '../config/services';
import { firstValueFrom } from 'rxjs';
import { OrderProducts } from './interfaces/orderProducts.interface';
import { PaidOrderDto } from './dto/paid-order.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger= new Logger('OrdersService')

  constructor(
    @Inject(NATS_SERVICE) private readonly client:ClientProxy
  ){
    super()
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Orders Database Connected')
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      const productsIds= createOrderDto.items.map(item=>item.productId)

      const products= await firstValueFrom(
        this.client.send({cmd:'validate_products'},productsIds)
      )

      //Calculate Total Amounts
      const totalAmount= createOrderDto.items.reduce((acc,orderItem)=>{
        const price= products.find(
          product=>product.id===orderItem.productId
          ).price
        return price * orderItem.quantity
      },0)

      const totalItems= createOrderDto.items.reduce((acc,orderItem)=>{
        return acc+orderItem.quantity
      },0)

      //Db
      const order = await this.order.create({
        data:{
          totalAmount,
          totalItems,
          status:'PENDING',
          OrderItem:{
            createMany:{
              data: createOrderDto.items.map((orderItem)=>({
                productId: orderItem.productId,
                quantity: orderItem.quantity,
                price: products.find((product)=>product.id===orderItem.productId).price
              }))
            }
          }
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId)
            .name,
        })),
      };
    } catch (error) {
      throw new RpcException({
        status:HttpStatus.BAD_REQUEST,
        message: `Check Logs`
      })
    }
  }

  findAll() {
    return this.order.findMany();
  }

  async findOne(id: string) {

    const order = await this.order.findFirst({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });

    if(!order){
      throw new RpcException({
        status:HttpStatus.NOT_FOUND,
        message:`Order with id: ${id} not found`
      })
    }
    const productIds = order.OrderItem.map((orderItem) => orderItem.productId);
    const products: any[] = await firstValueFrom(
      this.client.send({ cmd: 'validate_products' }, productIds),
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((product) => product.id === orderItem.productId)
          .name,
      })),
    };
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

  async createPaymentSession(order:OrderProducts){

    const paymentSession = await firstValueFrom(
      this.client.send('create.payment.session',{
        orderId:order.id,
        currency:'usd',
        items:order.OrderItem.map(item=>({
          name:item.name,
          price: item.price,
          quantity:item.quantity
        }))
      })
    )
    return paymentSession
  }
  
  async paidOrder(paidOrderDto:PaidOrderDto){
    const order = await this.order.update({
      where:{id:paidOrderDto.orderId},
      data:{
        status:'PAID',
        paid:true,
        paidAt:new Date(),
        stripeChargeId: paidOrderDto.stripePaymentId,

        OrderReceipt:{
          create:{
            receiptUrl:paidOrderDto.receiptUrl
          }
        }
      }
    })
    return order
  }
}
