import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('coachId') coachId?: string,
    @Query('playerId') playerId?: string,
  ) {
    // Automatically check for expired subscriptions when viewing the page
    await this.subscriptionsService.expireSubscriptions();
    return this.subscriptionsService.findAll(search, status, coachId, playerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }

  // Manual endpoint to trigger subscription expiration check (useful for testing)
  @Post('expire-check')
  async manualExpireCheck() {
    console.log('Manual subscription expiration check triggered via API');
    const result = await this.subscriptionsService.expireSubscriptions();
    return {
      success: true,
      message: 'Subscription expiration check completed',
      ...result,
    };
  }
}
