import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const mailConfig = this.configService.get<MailConfig>('mail');
    
    // Use a test account if no mail config is provided (for development)
    if (!mailConfig?.host) {
      this.logger.warn('No mail configuration found. Using ethereal.email test account.');
      nodemailer.createTestAccount().then(testAccount => {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.logger.log(`Ethereal test account created. Preview URL: https://ethereal.email`);
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: mailConfig.host,
        port: mailConfig.port,
        secure: mailConfig.secure,
        auth: {
          user: mailConfig.auth.user,
          pass: mailConfig.auth.pass,
        },
      });
    }
  }

  private async sendEmail(to: string, subject: string, html: string, text: string): Promise<void> {
    try {
      const from = this.configService.get<string>('mail.from') || 'noreply@xconfess.app';
      const mailOptions = {
        from: `"XConfess" <${from}>`,
        to,
        subject,
        text,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      
      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${to}: ${errorMessage}`);
      throw new Error(`Failed to send email: ${errorMessage}`);
    }
  }

  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const subject = 'Welcome to XConfess! 🎉';
    const html = this.generateWelcomeEmailTemplate(username);
    const text = this.generateWelcomeEmailText(username);
    
    await this.sendEmail(email, subject, html, text);
  }

  async sendReactionNotification(
    toEmail: string,
    username: string,
    reactorName: string,
    confessionContent: string,
    emoji: string,
  ): Promise<void> {
    const subject = `Someone reacted with ${emoji} to your confession!`;
    const html = this.generateReactionEmailTemplate(username, reactorName, confessionContent, emoji);
    const text = this.generateReactionEmailText(username, reactorName, confessionContent, emoji);
    
    await this.sendEmail(toEmail, subject, html, text);
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    username?: string,
  ): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = this.generateResetEmailTemplate(username || 'User', resetUrl, resetToken);
    const text = this.generateResetEmailText(username || 'User', resetUrl);
    
    await this.sendEmail(email, 'Password Reset Request - XConfess', html, text);
  }

  private generateResetEmailTemplate(username: string, resetUrl: string, token: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset - XConfess</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>XConfess - Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${username},</h2>
            <p>We received a request to reset your password for your XConfess account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset My Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p><strong>This link will expire in 15 minutes for security purposes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>For security purposes, your reset token is: <code>${token}</code></p>
          </div>
          <div class="footer">
            <p>This is an automated message from XConfess. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateResetEmailText(username: string, resetUrl: string): string {
    return `
      Hi ${username},

      You requested to reset your password. Please click the link below to set a new password:

      ${resetUrl}

      If you didn't request this, please ignore this email.
      This link will expire in 15 minutes for security purposes.

      Thanks,
      The XConfess Team
    `;
  }

  private generateWelcomeEmailTemplate(username: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to XConfess!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 8px; }
          .button {
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to XConfess, ${username}! 🎉</h1>
        </div>
        
        <div class="content">
          <p>Hello ${username},</p>
          
          <p>Thank you for joining XConfess! We're excited to have you on board.</p>
          
          <p>With XConfess, you can:</p>
          <ul>
            <li>Share your thoughts and confessions anonymously</li>
            <li>React to others' confessions with emojis</li>
            <li>Connect with a community of like-minded individuals</li>
          </ul>
          
          <p>Get started by exploring the latest confessions or share your own!</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Start Exploring</a>
          </div>
          
          <p>If you have any questions or need assistance, feel free to reply to this email.</p>
          
          <p>Happy confessing!<br>The XConfess Team</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} XConfess. All rights reserved.</p>
          <p>If you didn't create an account with us, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailText(username: string): string {
    return `
      Welcome to XConfess, ${username}! 🎉

      Thank you for joining XConfess! We're excited to have you on board.

      With XConfess, you can:
      - Share your thoughts and confessions anonymously
      - React to others' confessions with emojis
      - Connect with a community of like-minded individuals

      Get started by visiting: ${process.env.FRONTEND_URL || 'http://localhost:3000'}

      If you have any questions or need assistance, feel free to reply to this email.

      Happy confessing!
      The XConfess Team

      ---
      ${new Date().getFullYear()} XConfess. All rights reserved.
      If you didn't create an account with us, please ignore this email.
    `;
  }

  private generateReactionEmailTemplate(
    username: string,
    reactorName: string,
    confessionContent: string,
    emoji: string
  ): string {
    const truncatedContent = confessionContent.length > 100 
      ? `${confessionContent.substring(0, 100)}...` 
      : confessionContent;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Reaction to Your Confession</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 8px; }
          .confession { 
            background-color: #fff; 
            border-left: 4px solid #4CAF50; 
            padding: 15px; 
            margin: 20px 0;
            font-style: italic;
          }
          .reaction { 
            font-size: 24px; 
            text-align: center; 
            margin: 20px 0;
          }
          .button {
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Reaction to Your Confession! ${emoji}</h1>
        </div>
        
        <div class="content">
          <p>Hello ${username},</p>
          
          <p>Someone reacted to your confession:</p>
          
          <div class="confession">
            "${truncatedContent}"
          </div>
          
          <div class="reaction">
            ${emoji} ${reactorName || 'Someone'} reacted with ${emoji}
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/confessions" class="button">View All Reactions</a>
          </div>
          
          <p>Keep the conversation going and check out what others are saying!</p>
          
          <p>Best regards,<br>The XConfess Team</p>
        </div>
        
        <div class="footer">
          <p> ${new Date().getFullYear()} XConfess. All rights reserved.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/notifications">Manage your notification preferences</a></p>
        </div>
      </body>
      </html>
    `;
  }

  private generateReactionEmailText(
    username: string,
    reactorName: string,
    confessionContent: string,
    emoji: string
  ): string {
    const truncatedContent = confessionContent.length > 100 
      ? `${confessionContent.substring(0, 100)}...` 
      : confessionContent;

    return `
      New Reaction to Your Confession! ${emoji}

      Hello ${username},

      ${reactorName || 'Someone'} reacted with ${emoji} to your confession:

      "${truncatedContent}"

      View all reactions: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/confessions

      Keep the conversation going and check out what others are saying!

      Best regards,
      The XConfess Team

      ---
      ${new Date().getFullYear()} XConfess. All rights reserved.
      Manage your notification preferences: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/notifications
    `;
  }
}