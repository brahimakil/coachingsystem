import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get('stats')
  async getStatistics() {
    // Automatically check for expired subscriptions when viewing dashboard
    await this.subscriptionsService.expireSubscriptions();
    return this.dashboardService.getStatistics();
  }
}
