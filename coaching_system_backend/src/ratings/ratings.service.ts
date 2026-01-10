import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @Inject('FIRESTORE') private firestore: Firestore,
  ) {}

  private ratingsCollection = 'ratings';

  async create(createRatingDto: CreateRatingDto) {
    const { coachId, playerId, rating, review, playerName } = createRatingDto;

    // Check if player has an active or completed subscription with the coach
    const subscriptionSnapshot = await this.firestore
      .collection('subscriptions')
      .where('coachId', '==', coachId)
      .where('playerId', '==', playerId)
      .get();

    if (subscriptionSnapshot.empty) {
      throw new BadRequestException('You must have a subscription with this coach to leave a review');
    }

    // Check if player already rated this coach
    const existingRating = await this.firestore
      .collection(this.ratingsCollection)
      .where('coachId', '==', coachId)
      .where('playerId', '==', playerId)
      .get();

    if (!existingRating.empty) {
      throw new BadRequestException('You have already rated this coach. You can update your existing rating.');
    }

    // Get player name if not provided
    let finalPlayerName = playerName;
    if (!finalPlayerName) {
      const playerDoc = await this.firestore.collection('players').doc(playerId).get();
      if (playerDoc.exists) {
        finalPlayerName = playerDoc.data()?.name || 'Anonymous';
      }
    }

    const ratingData = {
      coachId,
      playerId,
      playerName: finalPlayerName || 'Anonymous',
      rating,
      review: review || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await this.firestore.collection(this.ratingsCollection).add(ratingData);

    // Update coach's average rating
    await this.updateCoachAverageRating(coachId);

    return {
      id: docRef.id,
      ...ratingData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async findAll(coachId?: string, playerId?: string) {
    let query: FirebaseFirestore.Query = this.firestore.collection(this.ratingsCollection);

    if (coachId) {
      query = query.where('coachId', '==', coachId);
    }

    if (playerId) {
      query = query.where('playerId', '==', playerId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async findOne(id: string) {
    const doc = await this.firestore.collection(this.ratingsCollection).doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException('Rating not found');
    }

    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  async findByCoachAndPlayer(coachId: string, playerId: string) {
    const snapshot = await this.firestore
      .collection(this.ratingsCollection)
      .where('coachId', '==', coachId)
      .where('playerId', '==', playerId)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  async update(id: string, updateRatingDto: UpdateRatingDto) {
    const docRef = this.firestore.collection(this.ratingsCollection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Rating not found');
    }

    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (updateRatingDto.rating !== undefined) {
      updateData.rating = updateRatingDto.rating;
    }

    if (updateRatingDto.review !== undefined) {
      updateData.review = updateRatingDto.review;
    }

    await docRef.update(updateData);

    // Update coach's average rating
    const ratingData = doc.data();
    if (ratingData?.coachId) {
      await this.updateCoachAverageRating(ratingData.coachId);
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const doc = await this.firestore.collection(this.ratingsCollection).doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException('Rating not found');
    }

    const ratingData = doc.data();
    await this.firestore.collection(this.ratingsCollection).doc(id).delete();

    // Update coach's average rating
    if (ratingData?.coachId) {
      await this.updateCoachAverageRating(ratingData.coachId);
    }

    return { message: 'Rating deleted successfully' };
  }

  async getCoachRatingStats(coachId: string) {
    const snapshot = await this.firestore
      .collection(this.ratingsCollection)
      .where('coachId', '==', coachId)
      .get();

    if (snapshot.empty) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const ratings = snapshot.docs.map(doc => doc.data().rating as number);
    const totalReviews = ratings.length;
    const averageRating = ratings.reduce((a, b) => a + b, 0) / totalReviews;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      if (r >= 1 && r <= 5) {
        ratingDistribution[r as 1 | 2 | 3 | 4 | 5]++;
      }
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
    };
  }

  private async updateCoachAverageRating(coachId: string) {
    const stats = await this.getCoachRatingStats(coachId);

    await this.firestore.collection('coaches').doc(coachId).update({
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
