import {
    WebSocketGateway,
    OnGatewayInit,
    WebSocketServer,
    OnGatewayConnection,
    SubscribeMessage,
    WsResponse,
    MessageBody
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { GameService } from './game.service';
  import { Game } from './game.class';
import { join } from 'path';
import { ClientSession } from 'typeorm';
  
  interface CustomSocket extends Socket {
    playerId?: string;
    userId?: number;
    spectatorId?: string;
    gameId?: string;
  }

  const colorCodes = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  };

  @WebSocketGateway({
    namespace: 'game',
    cors: {
      origin: 'http://localhost:3000', 
      methods: ['GET', 'POST'],
      credentials: true,
    }
  })
  export class GameGateway implements OnGatewayInit, OnGatewayConnection {

    constructor(private gameService: GameService) {}
  
    @WebSocketServer()
    server: Server;
  
    games = {}; // Pour stocker les états des jeux
  
    afterInit(server: Server) {
      console.log('Socket.io server initialized');
    }
  
    handleConnection(client: Socket, ...args: any[]) {
    console.log(colorCodes.green +`Client ${client.id} connected GAME SERVER. from ${client}`+ colorCodes.white);
    const userIdString = client.handshake.query.userId;
    console.log(colorCodes.cyan + "HC GAME SERVER ===> userIdString:" , userIdString + colorCodes.white);
  
    let userId: number;
  
    if (Array.isArray(userIdString)) {
      // Si userIdString est un tableau, prendre la première valeur
      userId = parseInt(userIdString[0], 10);
    } else {
      // Sinon, c'est une chaîne de caractères, alors la convertir directement
      userId = parseInt(userIdString, 10);
    }
    }
  
    getGames() {
        const gameInfos = {};
        for (let gameId in this.games) {
          const game = this.games[gameId];
          gameInfos[gameId] = {
            gameId: game.gameId,
            mode: game.mode,
            player1ID: game.player1ID,
            player2ID: game.player2ID,
            scores: game.scores,
          };
        }
        return gameInfos;
      }
  
    @SubscribeMessage('getAllGames')
    getAllGames(client: Socket, data: any): WsResponse<any> {
      const games = this.getGames();
      client.emit('gamesData', games);
      return;
    }
  
    @SubscribeMessage('joinRoomSpec')
    joinRoomSpec(client: CustomSocket, data: any): void {
        if (!data || typeof data.gameId === 'undefined' || typeof data.ID42 === 'undefined') {
            console.log('Invalid data received');
            return;
        }
        const { gameId, ID42 } = data;
        const game = this.games[gameId];
        if (game) {
            game.assignSpectatorId(client, this.server, ID42);
            client.join(gameId);
            client.gameId = gameId;
            client.emit('gameJoined', {
                gameId,
                ballStart: game.ball,
                scoresStart: game.scores,
            });
            console.log(`Spectator joined game with ID: ${gameId}`);
        } else {
            console.log('Game not found');
            return;
        }
    }

    @SubscribeMessage('createGame')
    createGame(client: CustomSocket, data: any): void {
      // console.log(`Entering createGame. Client ID: ${client.id}, User ID: ${data.userId}`);
      const { userId, ID42, mode } = data;
      console.log('variable mode reçue: ', mode);
      
      // Cherche une partie existante avec des places libres
      for (let gameId in this.games) {
        console.log(colorCodes.magenta+'toutes les games======>: ', this.games+colorCodes.white);
        console.log(colorCodes.cyan+`Entering createGame dans for. Client ID: ${client.id}` + colorCodes.white);
        const game = this.games[gameId];
        if (game.connectedPlayers < game.maxPlayers && game.mode === mode) {
          console.log(colorCodes.cyan+`Entering createGame dans if. Client ID: ${client.id}` + colorCodes.white);
          console.log(colorCodes.magenta+'============P2============' +colorCodes.white)
          game.assignPlayerId(client, this.server, userId);
          game.player2ID = ID42;
          console.log(`Player 2 ID set: ${game.player2ID}`);
          console.log(colorCodes.cyan+`Entering createGame avant join. Client ID: ${client.id}` + colorCodes.white);
          client.join(gameId);
          client.gameId = gameId;
          client.emit('gameJoined', {
            gameId,
            ballStart: game.ball,
            scoresStart: game.scores
          });
          console.log(`Player joined game with ID: ${gameId}`);
          if (game.connectedPlayers === game.maxPlayers) {
            this.server.to(gameId).emit('gameReady');
          }
          this.server.emit('gamesData', this.getGames());       
          return;
        }
      }
    
      // Crée une partie si pas d'existante avec des places libres
      const gameId = Math.random().toString(36).substring(2, 7);
      console.log(Game);
      const game = new Game(gameId, mode);
      game.assignPlayerId(client, this.server, userId);
      console.log(colorCodes.magenta+'gameMaxplayers=====>>>>>> ', game.maxPlayers+colorCodes.white);
      
      if (game.connectedPlayers < game.maxPlayers) {
        console.log(colorCodes.magenta+'============P1============' +colorCodes.white)
        this.games[gameId] = game;
        game.player1ID = ID42;
        console.log(`Player 1 ID set: ${game.player1ID}`);
        client.join(gameId);
        game.gameId = gameId;
        client.emit('gameCreated', { gameId });
        console.log(`Game created with ID: ${gameId}`);
      } else {
        client.emit('error', { message: 'Game is broken' });
      }
    }
     
    
    @SubscribeMessage('joinGame')
    joinGame(client: CustomSocket, data: any): void {
        const { userId, ID42, gameId } = data;
      console.log(colorCodes.red + 'on est ici donc dans joingame .//////....'+ colorCodes.white);
        if (this.games[gameId]) {
          const game = this.games[gameId];
          if (game.connectedPlayers < game.maxPlayers) { // Vérifier si le jeu a déjà le nombre maximal de joueurs
            client.join(gameId);
            client.gameId = gameId;  // Save the gameId to the socket
            console.log(colorCodes.cyan+`Player ${userId} joined game with ID: ${gameId}` +colorCodes.white );
      
            game.assignPlayerId(client, this.server, userId);
            game.player2ID = ID42;
            console.log(colorCodes.cyan+`dnas join ////Player 2 ID set:////  ${game.player2ID}` +colorCodes.white);
            console.log(colorCodes.blue+'game.ball======> ', game.ball + colorCodes.white)
            console.log(colorCodes.blue+'game.score======> ', game.scores + colorCodes.white)
            client.emit('gameJoined', {
              gameId,
              ballStart: game.ball,
              scoresStart: game.scores
            });
            
            if (game.connectedPlayers === game.maxPlayers) {
              this.server.to(gameId).emit('gameReady');
            }
            
            this.server.emit('gamesData', this.getGames()); // Note : Assurez-vous que getGames est également migré
          } else {
            client.emit('error', { message: 'Game is full' });
          }
        } else {
          client.emit('error', { message: 'Invalid game ID' });
        }
    }

    @SubscribeMessage('saveGameData')
    saveGameData(client: Socket, gameData: any): void {
        const game = this.games[gameData.roomId];
        console.log(colorCodes.blue+ "gameid ===> ", gameData.roomId + colorCodes.white)
        this.gameService.saveGame(game)
        .then(response => {
            console.log('Game data saved successfully:', response);
        })
        .catch(error => {
            console.error('Failed to save game data:', error);
        });
    }

    @SubscribeMessage('paddleMove')
    handlePaddleMove(client: Socket, data: any): void {
      const game = this.games[data.gameId];
      if (game) {
        game.handlePaddleMove(data, client, this.server);
      }
    }
    
    handleDisconnect(client: CustomSocket): void {
      this.server.emit('gamesData', this.getGames());
      console.log(colorCodes.red+ `un joueur s est deconnecte` +colorCodes.white)
    }

    @SubscribeMessage('gameIdDisconnect')
    handleGameIdDisconnect(client: CustomSocket, data: any): WsResponse<void> {
    const game = this.games[data.gameId];
    if (game) {
        // Traitez la logique de suppression ici
        delete this.games[data.gameId];
    }
    return;
}
    
    @SubscribeMessage('playerDisconnected')
    handlePlayerDisconnected(client: Socket): void {
      client.emit('message', 'Un joueur s\'est déconnecté. Il ne reste qu\'un joueur en jeu.');
    }
}
 