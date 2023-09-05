import React from 'react'
import styles from './ScoreInfoMiddle.module.css'
import { Avatar, Box, Button, ButtonGroup, Typography } from '@mui/material'
import { Game } from '../../app/profil/page';
import Link from 'next/link';


// ScoreInfo component
interface GameProps {
  games: Game[] | null;
  userId: number | null;
}

const ScoreInfo : React.FC<GameProps> = ({games, userId}) => {
  console.log(games);
  return (
    <div>
       <div
              style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop:'-80px',
              }}
              >
                <Typography variant="h5" gutterBottom sx={{
                  margin:'0',
                  color:'white',
                }}>
                </Typography>
                <div className={styles.container}>
          {games?.map((game, index) => (
            <div key={index} className={styles.container_text}>
              <div className={styles.pseudo}>
                <Avatar
                  alt="User Avatar"
                  src={game.user1.id === userId ? game.user1.imageUrl : game.user2.imageUrl}
                  sx={{ width: 40, height: 40 }}
                />
                <Link href={`/profil/${game.user1.id === userId ? game.user1.username : game.user2.username}`} passHref>
                  <p className={styles.comp}>{game.user1.id === userId ? game.user1.username : game.user2.username}</p>
                </Link>
                <p className={styles.comp}>{game.user1.id === userId ? game.score.split('-')[0] : game.score.split('-')[1]}</p>
              </div>
              <p style={{ fontWeight: '700', color: 'white' }}>{game.mode === "boost" ? "Boost" : "Normal"}</p>
              <div className={styles.pseudo2}>
                <p className={styles.comp}>{game.user1.id === userId ? game.score.split('-')[1] : game.score.split('-')[0]}</p>
                <Link href={`/profil/${game.user1.id === userId ? game.user2.username : game.user1.username}`} passHref>
                  <p className={styles.comp}>{game.user1.id === userId ? game.user2.username : game.user1.username}</p>
                </Link>
                <Avatar
                  alt="User Avatar"
                  src={game.user1.id === userId ? game.user2.imageUrl : game.user1.imageUrl}
                  sx={{ width: 40, height: 40 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScoreInfo;