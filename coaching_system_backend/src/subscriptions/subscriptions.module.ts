import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [FirebaseModule, ChatModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
