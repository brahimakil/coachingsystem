import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(@Inject('FIRESTORE') private firestore: Firestore) {}
  
  private subscriptionsCollection = 'subscriptions';

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    console.log('Creating subscription with data:', createSubscriptionDto);

    // Validate dates
    const startDate = new Date(createSubscriptionDto.startDate);
    const endDate = new Date(createSubscriptionDto.endDate);
    const now = new Date();

    // Ensure start date is before end date
    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check if end date has already passed and status is 'active'
    if (createSubscriptionDto.status === 'active' && endDate < now) {
      throw new BadRequestException(
        'Cannot create an active subscription with an end date in the past. Please use "stopped" status or update the end date.'
      );
    }

    // Check for existing active subscription with same coach and player
    const existingActiveSubscription = await this.firestore
      .collection(this.subscriptionsCollection)
      .where('playerId', '==', createSubscriptionDto.playerId)
      .where('coachId', '==', createSubscriptionDto.coachId)
      .where('status', '==', 'active')
      .get();

    if (!existingActiveSubscription.empty) {
      throw new BadRequestException(
        'This player already has an active subscription with this coach. Please stop or complete the existing subscription first.'
      );
    }

    // Check for overlapping subscriptions (any status) with same coach and player
    const allSubscriptions = await this.firestore
      .collection(this.subscriptionsCollection)
      .where('playerId', '==', createSubscriptionDto.playerId)
      .where('coachId', '==', createSubscriptionDto.coachId)
      .get();

    if (!allSubscriptions.empty) {
      for (const doc of allSubscriptions.docs) {
        const existingData = doc.data();
        const existingStart = new Date(existingData.startDate);
        const existingEnd = new Date(existingData.endDate);

        // Check if dates overlap
        const hasOverlap = 
          (startDate >= existingStart && startDate <= existingEnd) || // New start is within existing
          (endDate >= existingStart && endDate <= existingEnd) ||     // New end is within existing
          (startDate <= existingStart && endDate >= existingEnd);     // New completely contains existing

        if (hasOverlap) {
          throw new BadRequestException(
            `This player already has a subscription with this coach during this period (${existingData.startDate} to ${existingData.endDate}). Please choose different dates.`
          );
        }
      }
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

  // Method to check and expire subscriptions
  // Called automatically when viewing subscriptions page or dashboard
  async expireSubscriptions() {
    const startTime = new Date();
    console.log(`[EXPIRATION CHECK] Starting subscription expiration check at ${startTime.toISOString()}`);
    
    try {
      const now = new Date();
      now.setHours(23, 59, 59, 999); // Set to end of today for comparison
      
      // Find all active subscriptions
      const activeSubscriptions = await this.firestore
        .collection(this.subscriptionsCollection)
        .where('status', '==', 'active')
        .get();

      if (activeSubscriptions.empty) {
        console.log('[EXPIRATION CHECK] No active subscriptions to check');
        return { expiredCount: 0, totalChecked: 0 };
      }

      let expiredCount = 0;
      const totalChecked = activeSubscriptions.docs.length;
      const expiredSubscriptions: Array<{ id: string; playerId: string; coachId: string; endDate: string }> = [];

      // Check each subscription's end date
      for (const doc of activeSubscriptions.docs) {
        const data = doc.data();
        const endDate = new Date(data.endDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day

        // If end date has passed (end date is before end of today), mark as stopped
        // This means subscription expires AFTER the end date, not ON the end date
        if (endDate < now) {
          await doc.ref.update({
            status: 'stopped',
            updatedAt: new Date().toISOString(),
            expiredAt: new Date().toISOString(),
            expiredBy: 'system-auto',
          });
          
          expiredCount++;
          expiredSubscriptions.push({
            id: doc.id,
            playerId: data.playerId || 'unknown',
            coachId: data.coachId || 'unknown',
            endDate: data.endDate,
          });
          
          console.log(`[EXPIRATION CHECK] Expired subscription ${doc.id} (Player: ${data.playerId}, Coach: ${data.coachId}, End Date: ${data.endDate})`);
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      console.log(`[EXPIRATION CHECK] Completed in ${duration}ms. Checked: ${totalChecked}, Expired: ${expiredCount}`);
      
      if (expiredCount > 0) {
        console.log('[EXPIRATION CHECK] Expired subscriptions details:', JSON.stringify(expiredSubscriptions, null, 2));
      }

      return { expiredCount, totalChecked, duration };
    } catch (error) {
      console.error('[EXPIRATION CHECK ERROR] Error in expireSubscriptions:', error);
      throw error;
    }
  }

  async checkSubscription(playerId: string, coachId: string) {
    try {
      const snapshot = await this.firestore
        .collection(this.subscriptionsCollection)
        .where('playerId', '==', playerId)
        .where('coachId', '==', coachId)
        .get();

      if (snapshot.empty) {
        return {
          success: true,
          hasSubscription: false,
          canSubscribe: true,
          subscription: null,
        };
      }

      // Get the most recent subscription
      const subscriptions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by createdAt descending
      subscriptions.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      const latestSubscription = subscriptions[0] as any;

      return {
        success: true,
        hasSubscription: true,
        canSubscribe: latestSubscription.status === 'rejected' ? false : latestSubscription.status !== 'active' && latestSubscription.status !== 'pending',
        subscription: latestSubscription,
      };
    } catch (error) {
      console.error('Error checking subscription:', error);
      throw error;
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

      // 5. Enrich subscriptions with names and full objects
      let enrichedSubscriptions = subscriptions.map(sub => {
        const player = playerMap.get(sub.playerId);
        const coach = coachMap.get(sub.coachId);

        return {
          ...sub,
          playerName: player?.name || sub.playerId || 'Unknown',
          playerEmail: player?.email || '',
          player: player || null,
          coachName: coach?.name || sub.coachId || 'Unknown',
          coachEmail: coach?.email || '',
          coach: coach || null,
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
    
    // Validate dates if they're being updated
    if (updateSubscriptionDto.startDate && updateSubscriptionDto.endDate) {
      const startDate = new Date(updateSubscriptionDto.startDate);
      const endDate = new Date(updateSubscriptionDto.endDate);
      
      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    } else if (updateSubscriptionDto.endDate) {
      const startDate = new Date(currentData?.startDate);
      const endDate = new Date(updateSubscriptionDto.endDate);
      
      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after the current start date');
      }
    } else if (updateSubscriptionDto.startDate) {
      const startDate = new Date(updateSubscriptionDto.startDate);
      const endDate = new Date(currentData?.endDate);
      
      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before the current end date');
      }
    }

    // Filter out undefined values to avoid Firestore error
    const subscriptionData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only add fields that are actually provided (not undefined)
    if (updateSubscriptionDto.playerId !== undefined) {
      subscriptionData.playerId = updateSubscriptionDto.playerId;
    }
    if (updateSubscriptionDto.coachId !== undefined) {
      subscriptionData.coachId = updateSubscriptionDto.coachId;
    }
    if (updateSubscriptionDto.status !== undefined) {
      subscriptionData.status = updateSubscriptionDto.status;
    }
    if (updateSubscriptionDto.startDate !== undefined) {
      subscriptionData.startDate = updateSubscriptionDto.startDate;
    }
    if (updateSubscriptionDto.endDate !== undefined) {
      subscriptionData.endDate = updateSubscriptionDto.endDate;
    }

    // Only check and force expiration if trying to set status to 'active'
    // AND the end date (new or existing) has already passed
    if (subscriptionData.status === 'active') {
      const endDate = new Date(subscriptionData.endDate || currentData?.endDate);
      const now = new Date();
      
      if (endDate < now) {
        console.log('End date has passed, forcing status to stopped');
        subscriptionData.status = 'stopped';
        subscriptionData.expiredAt = new Date().toISOString();
        subscriptionData.expiredBy = 'system-validation';
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
