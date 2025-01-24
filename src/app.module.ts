import { Module } from '@nestjs/common';
import { GameGateway } from './game/game.gateway';
import { PrismaService } from './prisma/prisma.service';

@Module({
  providers: [GameGateway, PrismaService]
})
export class AppModule {}
