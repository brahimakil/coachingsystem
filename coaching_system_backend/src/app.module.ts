import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { CoachesModule } from './coaches/coaches.module';
import { PlayersModule } from './players/players.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TasksModule } from './tasks/tasks.module';
import { CalendarModule } from './calendar/calendar.module';
import { ChatModule } from './chat/chat.module';
import { EmailModule } from './email/email.module';
import { RatingsModule } from './ratings/ratings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    FirebaseModule,
    AuthModule,
    CoachesModule,
    PlayersModule,
    SubscriptionsModule,
    DashboardModule,
    TasksModule,
    CalendarModule,
    ChatModule,
    EmailModule,
    RatingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
