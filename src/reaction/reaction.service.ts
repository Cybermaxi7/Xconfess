import { Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { AnonymousConfession } from 'src/confession/entities/confession.entity';
import { Reaction } from './entities/reaction.entity';
import { EmailService } from '../email/email.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ReactionService {
  private readonly logger = new Logger(ReactionService.name);

  constructor(
    @InjectRepository(Reaction)
    private reactionRepo: Repository<Reaction>,
    @InjectRepository(AnonymousConfession)
    private confessionRepo: Repository<AnonymousConfession>,
    @Inject(forwardRef(() => EmailService))
    private emailService: EmailService,
  ) {}

  async createReaction(dto: CreateReactionDto, reactor?: User): Promise<Reaction> {
    // Find the confession with the user who created it
    const confession = await this.confessionRepo.findOne({
      where: { id: dto.confessionId },
      relations: ['user'],
    });

    if (!confession) {
      throw new NotFoundException('Confession not found');
    }

    // Create the reaction with proper typing
    const reaction = new Reaction();
    reaction.emoji = dto.emoji;
    reaction.confession = confession;
    if (reactor) {
      reaction.user = reactor; // Only set user if reactor is provided
    }

    const savedReaction = await this.reactionRepo.save(reaction);

    // Send notification to the confession author if they exist and have an email
    const confessionAuthor = confession.user;
    if (confessionAuthor?.email) {
      try {
        const reactorName = reactor?.username || 'Anonymous';
        const confessionContent = 'message' in confession ? confession.message : '';
        
        await this.emailService.sendReactionNotification(
          confessionAuthor.email,
          confessionAuthor.username || 'User',
          reactorName,
          confessionContent,
          dto.emoji
        );
        
        this.logger.log(`Reaction notification sent to ${confessionAuthor.email}`);
      } catch (error) {
        // Log but don't fail the reaction if email sending fails
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : '';
        
        this.logger.error(
          `Failed to send reaction notification to ${confessionAuthor.email}: ${errorMessage}`,
          errorStack
        );
      }
    }

    return savedReaction;
  }
}
