import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReactionService } from './reaction.service';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { Reaction } from './entities/reaction.entity';
import { User } from '../user/entities/user.entity';

@Controller('reactions')
@UseGuards(JwtAuthGuard)
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @Post()
  async addReaction(
    @Request() req: { user: User },
    @Body() dto: CreateReactionDto
  ): Promise<Reaction> {
    return this.reactionService.createReaction(dto, req.user);
  }
}
