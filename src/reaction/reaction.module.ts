import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReactionService } from './reaction.service';
import { ReactionController } from './reaction.controller';
import { AnonymousConfession } from 'src/confession/entities/confession.entity';
import { Reaction } from './entities/reaction.entity';
import { ConfessionModule } from 'src/confession/confession.module';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    forwardRef(() => ConfessionModule),
    forwardRef(() => EmailModule),
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([Reaction, AnonymousConfession]),
  ],
  controllers: [ReactionController],
  providers: [ReactionService],
  exports: [ReactionService],
})
export class ReactionModule {}
