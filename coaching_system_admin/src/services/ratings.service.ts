import api from './api';

export interface Rating {
  id: string;
  coachId: string;
  playerId: string;
  playerName: string;
  rating: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export const ratingsService = {
  async getAll(coachId?: string, playerId?: string): Promise<Rating[]> {
    const params = new URLSearchParams();
    if (coachId) params.append('coachId', coachId);
    if (playerId) params.append('playerId', playerId);

    const url = params.toString() ? `/ratings?${params.toString()}` : '/ratings';
    const response = await api.get(url);
    return response.data;
  },

  async getCoachStats(coachId: string): Promise<RatingStats> {
    const response = await api.get(`/ratings/coach/${coachId}/stats`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/ratings/${id}`);
  },
};
