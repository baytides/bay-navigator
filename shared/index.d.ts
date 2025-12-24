// Type definitions for shared client utilities

export interface CacheEntryStats {
  memoryEntries: number;
  storedEntries: number;
  ttlMs: number;
  maxEntries: number;
}

export interface CacheInterface {
  get(key: string): any;
  set(key: string, value: any, entryTtlMs?: number): void;
  remove(key: string): void;
  clear(): void;
  stats(): CacheEntryStats;
}

export interface CacheOptions {
  maxEntries?: number;
  ttlMs?: number;
  storage?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  } | null;
  namespace?: string;
}

export function createCache(options?: CacheOptions): CacheInterface;

export interface Program {
  id: string;
  name: string;
  category: string;
  area: string;
  city?: string;
  eligibility?: string[];
  benefit?: string;
  timeframe?: string;
  link?: string;
  link_text?: string;
  verified_date?: string;
}

export interface ProgramsResponse {
  count: number;
  programs: Program[];
}

export interface CategoriesResponse {
  count: number;
  categories: { category: string; count: number }[];
}

export interface AreasResponse {
  count: number;
  areas: { area: string; count: number }[];
}

export interface StatsResponse {
  totalPrograms: number;
  categories: { count: number; breakdown: { category: string; count: number }[] };
  areas: { total: number; top10: { area: string; count: number }[] };
  eligibility: { types: number; breakdown: { eligibility: string; count: number }[] };
}

export interface ApiClientOptions {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  cache?: CacheInterface | null;
}

export interface ApiResponse<T> {
  data: T;
  etag?: string | null;
  fromCache: boolean;
}

export class ApiClient {
  constructor(options?: ApiClientOptions);
  request<T = any>(path: string, options?: { method?: string; params?: Record<string, any>; headers?: Record<string, string>; body?: any; signal?: AbortSignal }): Promise<ApiResponse<T>>;
  getPrograms(params?: Record<string, any>): Promise<ApiResponse<ProgramsResponse>>;
  getProgramById(id: string): Promise<ApiResponse<Program>>;
  getCategories(): Promise<ApiResponse<CategoriesResponse>>;
  getAreas(): Promise<ApiResponse<AreasResponse>>;
  getStats(): Promise<ApiResponse<StatsResponse>>;
}

export interface TranslateOptions {
  texts: string[];
  targetLang: string;
  sourceLang?: string;
  endpoint?: string;
  fetchFn?: typeof fetch;
  cache?: CacheInterface | null;
  cacheTtlMs?: number;
}

export interface TranslateResult {
  translations: string[];
  fromCache: boolean;
}

export function translateTexts(options: TranslateOptions): Promise<TranslateResult>;
