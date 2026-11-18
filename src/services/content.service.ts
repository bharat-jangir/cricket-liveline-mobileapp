import { axiosInstance } from './apiClient';

export interface Article {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  body?: string;
  coverImage?: string | null;
  category: string;
  tags: string[];
  authorName?: string;
  publishedAt: string;
  views: number;
  related?: Article[];
}

export interface Short {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnail?: string | null;
  durationSec: number;
  views: number;
  likes: number;
}

export interface Paged<T> {
  result: T[];
  pagination?: { page: number; totalPages: number; total: number };
}

export const NEWS_CATEGORIES = ['general', 'match-report', 'analysis', 'preview', 'tournament', 'transfers', 'rules', 'venues', 'interview'];
export const categoryLabel = (c: string) => c.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

export const ContentService = {
  async getNews(params: { page?: number; limit?: number; category?: string; featured?: boolean } = {}): Promise<Paged<Article>> {
    const res = await axiosInstance.get('/app/news', { params });
    const data = res.data?.data ?? {};
    return { result: data.result ?? [], pagination: data.pagination };
  },

  async getArticle(idOrSlug: string): Promise<Article | null> {
    try {
      const res = await axiosInstance.get(`/app/news/${idOrSlug}`);
      return res.data?.data?.result ?? null;
    } catch (e: any) {
      if (e?.response?.status === 404) return null;
      throw e;
    }
  },

  async getShorts(page = 1, limit = 10): Promise<Paged<Short>> {
    const res = await axiosInstance.get('/app/shorts', { params: { page, limit } });
    const data = res.data?.data ?? {};
    return { result: data.result ?? [], pagination: data.pagination };
  },

  /** Fire-and-forget: a failed view ping must never affect playback. */
  viewShort(id: string) {
    axiosInstance.post(`/app/shorts/${id}/view`).catch(() => undefined);
  },

  async likeShort(id: string, like: boolean): Promise<number> {
    const res = await axiosInstance.post(`/app/shorts/${id}/like`, { like });
    return res.data?.data?.result?.likes ?? 0;
  },
};

/** Plain-text article body -> blocks. Blank line = paragraph break, "## " prefix = heading. */
export function parseBody(body: string): { type: 'h' | 'p'; text: string }[] {
  return String(body || '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => (b.startsWith('## ') ? { type: 'h' as const, text: b.slice(3).trim() } : { type: 'p' as const, text: b }));
}
