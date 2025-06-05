import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnonymousConfessionRepository } from './repository/confession.repository';
import { AnonymousConfession } from './entities/confession.entity';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnonymousConfession]),
    forwardRef(() => EmailModule),
    forwardRef(() => UserModule),
  ],
  providers: [AnonymousConfessionRepository],
  exports: [AnonymousConfessionRepository],
})
export class ConfessionModule {}
