import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game as GameEntity } from './game.entity';
import { PrismaClient } from '@prisma/client';


@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameEntity)
    private gamesRepository: Repository<GameEntity>,
    private prisma: PrismaClient,
  ) {}

  async findAllGames(): Promise<GameEntity[]> {
    return this.gamesRepository.find({ relations: ["user1", "user2"] });
  }

  saveGame(game: any) {
    const score = `${game.scores.player1Score} - ${game.scores.player2Score}`;
    return this.prisma.game.create({
      data: {
        user1Id: game.player1ID,
        user2Id: game.player2ID,
        score: score,
        match_date: new Date(),
        mode: game.mode,
      }
    });
  }
}
