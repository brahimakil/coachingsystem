import { Injectable, Inject, BadRequestException, OnModuleInit } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
  constructor(@Inject('FIRESTORE') private firestore: Firestore) {}

  // Run expiration check when the module initializes (on app startup)
  async onModuleInit() {
    console.log('Running initial subscription expiration check on startup...');
    await this.expireSubscriptions();
  }
  
  private subscriptionsCollection = 'subscriptions';

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    console.log('Creating subscription with data:', createSubscriptionDto);

    // Check for existing active subscription with same coach and player
    const existingSubscription = await this.firestore
      .collection(this.subscriptionsCollection)
      .where('playerId', '==', createSubscriptionDto.playerId)
      .where('coachId', '==', createSubscriptionDto.coachId)
      .where('status', '==', 'active')
      .get();

    if (!existingSubscription.empty) {
      throw new BadRequestException(
        'This player already has an active subscription with this coach. Please stop or complete the existing subscription first.'
      );
    }

    const subscriptionData = {
      ...createSubscriptionDto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await this.firestore
      .collection(this.subscriptionsCollection)
      .add(subscriptionData);

    console.log('Subscription created with ID:', docRef.id);

    return {
      id: docRef.id,
      ...subscriptionData,
    };
  }

  // Cron job to check and expire subscriptions every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireSubscriptions() {
    console.log('Running cron job to expire subscriptions...');
    
    try {
      const now = new Date();
      
      // Find all active subscriptions
      const activeSubscriptions = await this.firestore
        .collection(this.subscriptionsCollection)
        .where('status', '==', 'active')
        .get();

      if (activeSubscriptions.empty) {
        console.log('No active subscriptions to check');
        return;
      }

      let expiredCount = 0;

      // Check each subscription's end date
      for (const doc of activeSubscriptions.docs) {
        const data = doc.data();
        const endDate = new Date(data.endDate);

        // If end date has passed, mark as stopped
        if (endDate < now) {
          await doc.ref.update({
            status: 'stopped',
            updatedAt: new Date().toISOString(),
          });
          expiredCount++;
          console.log(`Expired subscription ${doc.id}`);
        }
      }

      console.log(`Cron job completed. Expired ${expiredCount} subscriptions.`);
    } catch (error) {
      console.error('Error in expireSubscriptions cron job:', error);
    }
  }

  async findAll(search?: string, status?: string, coachId?: string, playerId?: string) {
    console.log('Fetching subscriptions with filters:', {
      search: search || 'none',
      status: status || 'all',
      coachId: coachId || 'all',
      playerId: playerId || 'all',
    });

    try {
      let query: any = this.firestore.collection(this.subscriptionsCollection);

      if (status) {
        query = query.where('status', '==', status);
      }

      if (coachId) {
        query = query.where('coachId', '==', coachId);
      }

      if (playerId) {
        query = query.where('playerId', '==', playerId);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log('No subscriptions found');
        return [];
      }

      // 1. Get all basic subscription data
      const subscriptions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 2. Collect unique IDs for batch fetching
      const playerIds = [...new Set(subscriptions.map(sub => sub.playerId).filter(id => typeof id === 'string'))] as string[];
      const coachIds = [...new Set(subscriptions.map(sub => sub.coachId).filter(id => typeof id === 'string'))] as string[];

      // 3. Fetch players and coaches in parallel batches
      // Using getAll to fetch multiple documents by ID efficiently
      const [playersSnapshot, coachesSnapshot] = await Promise.all([
        playerIds.length > 0 ? this.firestore.getAll(...playerIds.map(id => this.firestore.collection('players').doc(id))) : [],
        coachIds.length > 0 ? this.firestore.getAll(...coachIds.map(id => this.firestore.collection('coaches').doc(id))) : []
      ]);

      // 4. Create lookup maps
      const playerMap = new Map();
      if (Array.isArray(playersSnapshot)) {
        playersSnapshot.forEach((doc: any) => {
          if (doc.exists) playerMap.set(doc.id, doc.data());
        });
      }

      const coachMap = new Map();
      if (Array.isArray(coachesSnapshot)) {
        coachesSnapshot.forEach((doc: any) => {
          if (doc.exists) coachMap.set(doc.id, doc.data());
        });
      }

      // 5. Enrich subscriptions with names
      let enrichedSubscriptions = subscriptions.map(sub => {
        const player = playerMap.get(sub.playerId);
        const coach = coachMap.get(sub.coachId);

        return {
          ...sub,
          playerName: player?.name || sub.playerId || 'Unknown',
          playerEmail: player?.email || '',
          coachName: coach?.name || sub.coachId || 'Unknown',
          coachEmail: coach?.email || '',
        };
      });

      // 6. Apply search filter
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        enrichedSubscriptions = enrichedSubscriptions.filter(
          (sub: any) =>
            sub.playerId?.toLowerCase().includes(searchLower) ||
            sub.coachId?.toLowerCase().includes(searchLower) ||
            sub.playerName?.toLowerCase().includes(searchLower) ||
            sub.coachName?.toLowerCase().includes(searchLower) ||
            sub.playerEmail?.toLowerCase().includes(searchLower) ||
            sub.coachEmail?.toLowerCase().includes(searchLower),
        );
      }

      console.log(`Found ${enrichedSubscriptions.length} subscriptions`);
      return enrichedSubscriptions;
    } catch (error) {
      console.error('Error in findAll subscriptions:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    console.log('Fetching subscription with ID:', id);

    try {
      const doc = await this.firestore
        .collection(this.subscriptionsCollection)
        .doc(id)
        .get();

      if (!doc.exists) {
        throw new Error('Subscription not found');
      }

      const data = doc.data() || {};

      // Fetch player name and email
      let playerName = data.playerId || 'Unknown';
      let playerEmail = '';
      if (data.playerId) {
        try {
          const playerDoc = await this.firestore
            .collection('players')
            .doc(data.playerId)
            .get();
          if (playerDoc.exists) {
            const playerData = playerDoc.data();
            playerName = playerData?.name || data.playerId;
            playerEmail = playerData?.email || '';
          }
        } catch (err) {
          console.error('Error fetching player:', err);
        }
      }

      // Fetch coach name and email
      let coachName = data.coachId || 'Unknown';
      let coachEmail = '';
      if (data.coachId) {
        try {
          const coachDoc = await this.firestore
            .collection('coaches')
            .doc(data.coachId)
            .get();
          if (coachDoc.exists) {
            const coachData = coachDoc.data();
            coachName = coachData?.name || data.coachId;
            coachEmail = coachData?.email || '';
          }
        } catch (err) {
          console.error('Error fetching coach:', err);
        }
      }

      return {
        id: doc.id,
        ...data,
        playerName,
        playerEmail,
        coachName,
        coachEmail,
      };
    } catch (error) {
      console.error('Error in findOne subscription:', error);
      throw error;
    }
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    console.log('Updating subscription:', id, updateSubscriptionDto);

    // Get current subscription data
    const docRef = this.firestore.collection(this.subscriptionsCollection).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new BadRequestException('Subscription not found');
    }

    const currentData = doc.data();
    const subscriptionData: any = {
      ...updateSubscriptionDto,
      updatedAt: new Date().toISOString(),
    };

    // If trying to set status to 'active', check if end date has passed
    if (subscriptionData.status === 'active' || currentData?.status === 'active') {
      const endDate = new Date(subscriptionData.endDate || currentData?.endDate);
      const now = new Date();
      
      if (endDate < now) {
        console.log('End date has passed, forcing status to stopped');
        subscriptionData.status = 'stopped';
      }
    }

    await docRef.update(subscriptionData);

    console.log('Subscription updated successfully');

    return this.findOne(id);
  }

  async remove(id: string) {
    console.log('Deleting subscription with ID:', id);

    await this.firestore
      .collection(this.subscriptionsCollection)
      .doc(id)
      .delete();

    console.log('Subscription deleted successfully');

    return { message: 'Subscription deleted successfully' };
  }
}
