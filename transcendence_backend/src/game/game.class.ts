import { Socket } from 'socket.io';
import { Server } from "socket.io";

interface Paddle {
    x: number;
    y: number;
    width: number;
    height: number;
  }

interface CustomSocket extends Socket {
  playerId?: string;
  userId?: number;
  spectatorId?: string;
  gameId?: string;
}

export class Game {

    gameId: string;
    mode: string;
    connectedPlayers: number;
    maxPlayers: number;
    spectators: { [key: string]: CustomSocket };
    players: { [key: string]: CustomSocket };
    player1SocketId: string | null;
    player2SocketId: string | null;
    paddles: { [playerId: string]: Paddle };
    paddle1Y: number;
    paddle2Y: number;
    scores: { player1Score: number, player2Score: number };
    ball: { x: number, y: number, speedX: number, speedY: number, radius: number };
    waitingQueue: string[];
    disconnectTimeouts: { [key: string]: NodeJS.Timeout };
    paddleWidth: number;
    paddleHeight: number;
    paddleGap: number;
    gameInterval: NodeJS.Timeout | null = null;
    player1ID: number | null;
    player2ID: number | null;

    
    constructor(gameId, mode) {
      this.gameId = gameId;
      this.mode = mode; // 'normal' or 'boost';
      this.connectedPlayers = 0;
      this.maxPlayers = 2;
      this.spectators = {};
      this.players = {};
      this.player1SocketId = null;
      this.player2SocketId = null;
      this.paddles = {};   
      this.paddle1Y = 50;
      this.paddle2Y = 50;
      this.scores = {player1Score: 0, player2Score: 0};
      this.ball = {
        x: 50,
        y: 50,
        speedX: this.mode === 'boost' ? 1 : 0.33,
        speedY: this.mode === 'boost' ? 1 : 0.33,
        radius: 5,
      };
      this.waitingQueue = [];
      this.disconnectTimeouts = {};
      this.paddleWidth = 1;
      this.paddleHeight = 10;
      this.paddleGap = 4;
      this.gameInterval = null;
      this.player1ID = null;
      this.player2ID = null;
    }
  
    assignPlayerId(socket: CustomSocket, io: Server, userId: number) {
      console.log(`Entering assignPlayerId for user ${userId}. Current connected players: ${this.connectedPlayers}`);
      console.log(`Entering assignPlayerId. Socket ID: ${socket.id}, Socket connected: ${socket.connected}`);

  
      this.connectedPlayers += 1;
      const playerId = `player${this.connectedPlayers}`;
      
      console.log(`Assigned playerId: ${playerId} for user ${userId}`);
      
      socket.playerId = playerId;
      socket.userId = userId;
      
      this.players[playerId] = socket;
      this.paddles[playerId] = {
          x: playerId === 'player1' ? this.paddleGap : 100 - this.paddleGap - this.paddleWidth,
          y: 50,
          width: this.paddleWidth,
          height: this.paddleHeight
      };
      
      io.to(socket.id).emit('playerId', { playerId });
      console.log(`Emitting playerId to socket ${socket.id}`);
      
      if (this.connectedPlayers === 1) {
          console.log(`Emitting 'waitingForPlayer' to socket ${socket.id}`);
          socket.emit('waitingForPlayer');
      } else if (this.connectedPlayers === 2) {
          console.log('Two players connected. Starting game update interval.');
          if (this.gameInterval) {
              console.log('Clearing previous game interval.');
              clearTimeout(this.gameInterval);
          }
          this.gameInterval = setInterval(() => {
              // console.log('Running game update...');
              this.updateGame(io);
          }, 20);
      }
  }
  
  
    assignSpectatorId(socket: CustomSocket, io: Server, userId: number) {
      const spectatorId = `spectator${Object.keys(this.spectators).length + 1}`;
      socket.spectatorId = spectatorId;
      socket.userId = userId;
      this.spectators[spectatorId] = socket;
      io.to(socket.id).emit('spectatorId', { spectatorId, ball: this.ball, scores: this.scores, paddle1Y: this.paddle1Y, paddle2Y: this.paddle2Y });
    }
  
    handlePaddleMove(data, socket, io) {
      if (!this.paddles[data.player]) return;
      this.paddles[data.player].y = data.y;
      io.to(this.gameId).emit('paddleMoved', {
        playerId: data.player,
        newPosition: this.paddles[data.player]
      });
    }
  
    handleReconnect(socket: CustomSocket, io: Server, userId: number) {
      // Vérifier si le joueur existait déjà dans le jeu.
      let existingPlayer = null;
      Object.values(this.players).forEach(player => {
        if (player.userId === userId) {
          existingPlayer = this.players[userId];
        }
      });
  
      if (existingPlayer) {
        // Mettre à jour le socket du joueur
        this.players[existingPlayer.playerId] = socket;
        this.connectedPlayers += 1;
    
        // Informer le joueur reconnecté de l'état actuel du jeu
        socket.emit('gameState', {
          gameId: this.gameId,
          playerId: existingPlayer.playerId,
          paddlePosition: this.paddles[existingPlayer.playerId],
          score: this.scores[existingPlayer.playerId]
        });
  
        // Informer les autres joueurs de la reconnexion du joueur
        socket.broadcast.to(this.gameId).emit('playerReconnected', { playerId: existingPlayer.playerId });
      } else {
        // Si le joueur n'existait pas, envoyer une erreur
        socket.emit('error', { message: 'Player does not exist in game.' });
      }
    }

    handleDisco(socket: CustomSocket, io: Server) {
      if (socket.playerId) {
        console.log("connected dans class ====> "+ this.connectedPlayers)
        this.connectedPlayers -= 1;
        delete this.players[socket.playerId];
        delete this.paddles[socket.playerId];
    
        if (this.connectedPlayers === 0) {
          // If no players are connected, delete the gameId.
          console.log("delete dans class ====> "+ this.gameId)
          delete this.gameId;
        } else {
          // If other players are still connected, notify them of the disconnection.
          io.to(this.gameId).emit('playerDisconnected');
        }
      } else if (socket.spectatorId) {
        delete this.spectators[socket.spectatorId];
      }
    }
    
  
    handleTimeout(socket: CustomSocket, io: Server) {
      this.connectedPlayers--;
      if (socket.id === this.player1SocketId) {
        this.player1SocketId = null;
      } else if (socket.id === this.player2SocketId) {
        this.player2SocketId = null;
      }
      delete this.disconnectTimeouts[socket.id];
      
      // If a player disconnects and there are players waiting
      if (this.connectedPlayers < 2 && this.waitingQueue.length > 0) {
        let nextPlayerId = this.waitingQueue.shift();
        
        if (this.player1SocketId === null) {
          this.player1SocketId = nextPlayerId;
          io.to(nextPlayerId).emit('assignPlayerId', 1);
        } else if (this.player2SocketId === null) {
          this.player2SocketId = nextPlayerId;
          io.to(nextPlayerId).emit('assignPlayerId', 2);
        }
  
        // Resetting the game
        this.resetBall();
        this.scores = {player1Score: 0, player2Score: 0};
  
        this.connectedPlayers++;
        
        if (this.connectedPlayers === 2) {
          io.emit('startGame');
          if (this.gameInterval) clearTimeout(this.gameInterval);
          this.gameInterval = setInterval(() => this.updateGame(io), 20);
        }
      } else if (this.connectedPlayers < 2) {  // the disconnected client was a player and there are no players waiting
        if (this.gameInterval) {
          clearInterval(this.gameInterval);
          this.gameInterval = null;
        }
        io.emit('gameStopped'); // inform the other player that the game has been stopped
      }
    }
  
    endGame(io: Server, winningPlayer: string) {
      if (this.gameInterval) {
        clearInterval(this.gameInterval);
        this.gameInterval = null;
      }
      console.log('Game over. Winner:', winningPlayer);
    
      io.to(this.gameId).emit('gameOver', {
        winner: winningPlayer,
        loser: winningPlayer === 'player1' ? 'player2' : 'player1',
        ID42player1: this.player1ID,
        ID42player2: this.player2ID,
      });
    }
  
    updateGame(io: Server) {
      // Update ball position
      this.ball.x += this.ball.speedX;
      this.ball.y += this.ball.speedY;
  
      // Update paddle positions from client data
      this.paddle1Y = this.paddles.player1 ? this.paddles.player1.y : this.paddle1Y;
      this.paddle2Y = this.paddles.player2 ? this.paddles.player2.y : this.paddle2Y;
  
      // Checking for collisions with paddles and updating ball direction
      if (
        this.ball.x < this.paddleGap + this.paddleWidth &&
        this.ball.y > this.paddle1Y &&
        this.ball.y < this.paddle1Y + this.paddleHeight &&
        this.ball.speedX < 0 // Added this condition to prevent continuous collisions
      ) {
        this.ball.speedX = -this.ball.speedX;
        this.ball.x = this.paddleGap + this.paddleWidth + 0.5; // Adjusting the ball's x position
      } else if (
        this.ball.x > 100 - this.paddleGap - this.paddleWidth && 
        this.ball.y > this.paddle2Y &&
        this.ball.y < this.paddle2Y + this.paddleHeight &&
        this.ball.speedX > 0 // Added this condition to prevent continuous collisions
      ) {
        this.ball.speedX = -this.ball.speedX;
        this.ball.x = 100 - this.paddleGap - this.paddleWidth - 0.5; // Adjusting the ball's x position
      }
      // Checking for scores
      if (this.ball.x < 0) {
        this.scores.player2Score++;
        this.resetBall();
        if(this.scores.player2Score == 11){
          this.endGame(io, 'player2');
        }
      } else if (this.ball.x > 100) { 
        this.scores.player1Score++;
        this.resetBall();
        if(this.scores.player1Score == 11){
          this.endGame(io, 'player1');
        }
      }
      // Check for top and bottom wall collisions
      if (this.ball.y > 100 || this.ball.y < 0) {
        this.ball.speedY = -this.ball.speedY;
      }
      // Send the updated game state to all players
      io.to(this.gameId).emit('ballUpdate', this.ball);
      io.to(this.gameId).emit('scoresUpdate', this.scores);
  
      // Send the updated game state to all spectators
      for (let spectator of Object.values(this.spectators)) {
        spectator.emit('spectateGame', {
          ball: this.ball,
          paddle1Y: this.paddle1Y, // Send the position of paddle 1
          paddle2Y: this.paddle2Y, // Send the position of paddle 2
          scores: this.scores, // Send the scores
        });
      }
  
    }
  
    resetBall() {
      this.ball.x = 50;
      this.ball.y = 25 + Math.random() * 50;
      const randomDirectionX = Math.random() < 0.5 ? -1 : 1;
      const randomDirectionY = Math.random() < 0.5 ? -1 : 1;
      this.ball.speedX = this.ball.speedX * randomDirectionX;
      this.ball.speedY = this.ball.speedX * randomDirectionY;
    }
  }