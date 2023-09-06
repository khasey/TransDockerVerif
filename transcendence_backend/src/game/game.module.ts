import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from './game.service';
import { Game as GameEntity } from './game.entity';
import { GameGateway } from './game.gateway';
import {User as UserEntity} from "../user/user.entity";
import { PrismaClient } from '@prisma/client';


@Module({
  imports: [
    TypeOrmModule.forFeature([GameEntity, UserEntity]),
  ],
  providers: [
    GameService,
    GameGateway,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [
    GameService,
  ],
})
export class GameModule {}

