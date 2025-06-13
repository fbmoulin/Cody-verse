import type { ApiResponse, ApiError, Course, UserStats, GamificationData, Lesson } from '@/types';

class ApiService {
  private baseURL: string;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseURL = '/api';
    this.cache = new Map();
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T> | ApiError> {
    const cacheKey = `${options.method || 'GET'}_${endpoint}`;
    
    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      // Cache successful GET requests
      if (response.ok && (!options.method || options.method === 'GET')) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: this.CACHE_TTL
        });
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        code: 500
      };
    }
  }

  // Course Management
  async getCourses(): Promise<ApiResponse<Course[]> | ApiError> {
    return this.request<Course[]>('/courses');
  }

  async getCourse(id: string): Promise<ApiResponse<Course> | ApiError> {
    return this.request<Course>(`/courses/${id}`);
  }

  async getCourseLessons(courseId: string): Promise<ApiResponse<Lesson[]> | ApiError> {
    return this.request<Lesson[]>(`/courses/${courseId}/lessons`);
  }

  // User Progress
  async getUserStats(userId: string): Promise<ApiResponse<UserStats> | ApiError> {
    return this.request<UserStats>(`/users/${userId}/stats`);
  }

  async updateLessonProgress(
    userId: string, 
    lessonId: string, 
    progress: number
  ): Promise<ApiResponse<any> | ApiError> {
    return this.request<any>(`/users/${userId}/lessons/${lessonId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress })
    });
  }

  // Gamification
  async getGamificationDashboard(userId: string): Promise<ApiResponse<GamificationData> | ApiError> {
    return this.request<GamificationData>(`/gamification/dashboard/${userId}`);
  }

  async processLessonCompletion(
    userId: string, 
    lessonData: any
  ): Promise<ApiResponse<any> | ApiError> {
    this.invalidateUserCache(userId);
    return this.request<any>(`/gamification/lesson-completion`, {
      method: 'POST',
      body: JSON.stringify({ userId, ...lessonData })
    });
  }

  // Cody AI Assistant
  async sendCodyMessage(
    userId: string, 
    message: string, 
    interactionType: string = 'chat',
    context: any = {}
  ): Promise<ApiResponse<any> | ApiError> {
    return this.request<any>('/cody/interact', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        message,
        interactionType,
        context
      })
    });
  }

  // Cache Management
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  private invalidateUserCache(userId: string): void {
    this.invalidateCache(`/users/${userId}`);
    this.invalidateCache(`/gamification/dashboard/${userId}`);
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<any> | ApiError> {
    return this.request<any>('/health');
  }

  // Batch Operations
  async batchRequest<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(requests.map(request => request()));
  }
}

export const apiService = new ApiService();
export default apiService;