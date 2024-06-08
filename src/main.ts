import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/env';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule,{
    transport:Transport.TCP,
    options:{
      port:envs.port
    }
  });
  await app.listen();
}
bootstrap();
