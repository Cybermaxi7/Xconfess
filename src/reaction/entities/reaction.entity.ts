import { AnonymousConfession } from 'src/confession/entities/confession.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  emoji: string;

  @ManyToOne(() => AnonymousConfession, (confession) => confession.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'confession_id' })
  confession: AnonymousConfession;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * The user who created this reaction.
   * Can be null if the reaction is anonymous.
   */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
}
