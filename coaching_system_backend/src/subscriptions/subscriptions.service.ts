import { Injectable, Inject } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(@Inject('FIRESTORE') private firestore: Firestore) {}
  
  private subscriptionsCollection = 'subscriptions';

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    console.log('Creating subscription with data:', createSubscriptionDto);

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

  async findAll(search?: string, status?: string) {
    console.log('Fetching subscriptions with filters:', { search, status });

    try {
      let query: any = this.firestore.collection(this.subscriptionsCollection);

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log('No subscriptions found');
        return [];
      }

      let subscriptions = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          
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
        }),
      );

      // Apply search filter in memory since Firestore has limited text search
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        subscriptions = subscriptions.filter(
          (sub: any) =>
            sub.playerId?.toLowerCase().includes(searchLower) ||
            sub.coachId?.toLowerCase().includes(searchLower) ||
            sub.playerName?.toLowerCase().includes(searchLower) ||
            sub.coachName?.toLowerCase().includes(searchLower) ||
            sub.playerEmail?.toLowerCase().includes(searchLower) ||
            sub.coachEmail?.toLowerCase().includes(searchLower),
        );
      }

      console.log(`Found ${subscriptions.length} subscriptions`);
      return subscriptions;
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

    const subscriptionData: any = {
      ...updateSubscriptionDto,
      updatedAt: new Date().toISOString(),
    };

    await this.firestore
      .collection(this.subscriptionsCollection)
      .doc(id)
      .update(subscriptionData);

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
