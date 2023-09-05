import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';

@Entity({ name:'Message' })
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sender: number;

  @Column()
  message: string;

  @Column()
  date: Date;

  @Column()
  channelId: number;

  @Column()
  username: string;

  @Column()
  imageUrl: string;

  @ManyToOne(() => User, user => user.username)
  user: User;
}
