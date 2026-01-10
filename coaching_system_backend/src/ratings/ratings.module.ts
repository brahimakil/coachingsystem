import { Module } from '@nestjs/common';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
