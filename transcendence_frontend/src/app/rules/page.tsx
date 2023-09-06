'use client'
import Layout from 'src/component/Layout'
import styles from './rules.module.css'
import { AuthGuard } from 'src/api/HOC'

const Rules:React.FC = () => {
  return (
    <AuthGuard>
    <Layout>
      <div className={styles.all}>
        <div className={styles.all_rules}>
          <span className={styles.all_rules_title}>RULES</span>
          <div className={styles.all_rules_textRules}>
            <p className={styles.all_rules_textRules}> <span className={styles.gradientText}>Pong</span>  est un jeu vidéo classique qui simule un jeu de tennis de table en utilisant des graphismes simples.<br /><span className={styles.gradientText}> Voici les règles de base du jeu : </span> </p>
            <p className={styles.all_rules_textRules}>Deux joueurs s'affrontent, chacun contrôlant une raquette à l'écran. Le jeu commence avec une balle au milieu de l'écran.</p>
            <p className={styles.all_rules_textRules}>Les joueurs doivent faire rebondir la balle avec leur raquette pour l'envoyer vers le côté opposé de l'écran, et essayer de faire en sorte <br /> que l'adversaire ne puisse pas la renvoyer. <br /> Si un joueur manque la balle, l'autre joueur marque un point.</p>
            <p className={styles.all_rules_textRules}>Le premier joueur à atteindre 11 points remporte la partie.</p>
            <p className={styles.all_rules_textRules}> <span className={styles.gradientText}>Voici quelques règles supplémentaires qui peuvent varier selon les versions du jeu :</span></p>
            <p className={styles.all_rules_textRules}>La balle peut rebondir sur les murs de chaque côté de l'écran, mais pas sur les murs supérieur et inférieur. <br /> Les joueurs peuvent déplacer leur raquette verticalement le long de l'écran pour frapper la balle.</p>
            <p className={styles.all_rules_textRules}>La balle peut changer de direction et de vitesse après avoir été touchée par une raquette, ce qui peut rendre le jeu plus difficile. </p>
			<div className={styles.How2Play}>
			<span className={styles.gradientText2} > Comment jouer ?</span>
			<div className={styles.How2PlayContent}>
			<img className={styles.img} src="images/movepaddle.png" alt="img"/>
			<p className={styles.all_rules_textRules}>Déplacez votre raquette avec les touches <span className={styles.gradientText}>↑</span> et <span className={styles.gradientText}>↓</span> </p>

			</div>
			</div>
			<div className={styles.Mode}>
			<span className={styles.gradientText2} >Différents Modes :</span>
			<div className={styles.How2PlayMode}>
			<div className={styles.modeContainer}>
			<img className={styles.imgMode} src="images/normal.png" alt="img" />
			<div className={styles.modeText}>
    			<span className={styles.gradientText}>Mode Normal</span> <br/>
    			Aucun effet supplémentaire
			</div>
			</div>
			<div className={styles.modeContainer}>
			<img className={styles.imgMode} src="images/boost2.png" alt="img" />
			<div className={styles.modeText}>
    			<span className={styles.gradientText}>Mode Boost</span> <br/>
    			Vitesse de la balle multipliée par <span className={styles.gradientText}>3</span> !
			</div>
			</div>



			</div>

			</div>


          </div>
        </div>
      </div>
    </Layout>
    </AuthGuard>
  )
}

export default Rules
