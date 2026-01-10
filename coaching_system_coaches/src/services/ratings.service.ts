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

export const getMyRatings = async (coachId: string): Promise<Rating[]> => {
  const response = await api.get(`/ratings?coachId=${coachId}`);
  return response.data;
};

export const getMyRatingStats = async (coachId: string): Promise<RatingStats> => {
  const response = await api.get(`/ratings/coach/${coachId}/stats`);
  return response.data;
};
