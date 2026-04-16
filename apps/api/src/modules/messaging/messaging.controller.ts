import {
  Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { StartConversationDto, SendMessageDto } from './messaging.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Messaging')
@Controller('conversations')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Get()
  @ApiOperation({ summary: 'Get all conversations for current user' })
  async getConversations(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return { data: await this.messagingService.getConversations(userId, page, limit) };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  async unreadCount(@CurrentUser('id') userId: string) {
    return this.messagingService.getUnreadCount(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Start a conversation about a listing' })
  async start(
    @CurrentUser('id') userId: string,
    @Body() dto: StartConversationDto,
  ) {
    return { data: await this.messagingService.startConversation(userId, dto) };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return { data: await this.messagingService.getMessages(userId, id, page, limit) };
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return { data: await this.messagingService.sendMessage(userId, id, dto) };
  }
}
