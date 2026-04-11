/**
 * Bay Navigator Shared Types
 *
 * Type definitions for program data, API responses, and validation.
 */

// ============================================================================
// Program Data Types (from YAML)
// ============================================================================

/**
 * Raw program data as stored in YAML files
 */
export interface YamlProgram {
  id?: string;
  name: string;
  category?: string;
  groups?: string[];
  eligibility?: string[]; // Legacy field, maps to groups
  description?: string;
  benefit?: string; // Legacy field, maps to description
  what_they_offer?: string;
  how_to_get_it?: string;
  link?: string;
  website?: string; // Legacy field, maps to link
  phone?: string;
  email?: string;
  address?: string;
  area?: string | string[];
  city?: string;
  cost?: string;
  requirements?: string;
  how_to_apply?: string;
  keywords?: string[];
  life_events?: string[];
  agency?: string;
  verified_by?: string;
  verified_date?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Transformed program data for API output
 */
export interface ApiProgram {
  id: string;
  name: string;
  category: string;
  description: string;
  fullDescription: string | null;
  whatTheyOffer: string | null;
  howToGetIt: string | null;
  groups: string[];
  areas: string[];
  city: string | null;
  website: string;
  cost: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  requirements: string | null;
  howToApply: string | null;
  keywords: string[];
  lifeEvents: string[];
  agency: string | null;
  lastUpdated: string;
  verifiedBy?: string;
  verifiedDate?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ProgramsResponse {
  total: number;
  count: number;
  offset: number;
  programs: ApiProgram[];
}

export interface CategoryMetadata {
  id: string;
  name: string;
  icon: string;
}

export interface Category extends CategoryMetadata {
  programCount: number;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface GroupMetadata {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Group extends GroupMetadata {
  programCount: number;
}

export interface GroupsResponse {
  groups: Group[];
}

export interface Area {
  id: string;
  name: string;
  type: 'county' | 'region' | 'state' | 'nationwide';
  programCount: number;
}

export interface AreasResponse {
  areas: Area[];
}

export interface ApiMetadata {
  version: string;
  generatedAt: string;
  totalPrograms: number;
  endpoints: {
    programs: string;
    categories: string;
    groups: string;
    areas: string;
    singleProgram: string;
  };
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
  program: string;
  message: string;
}

export interface ValidationWarning {
  program: string;
  message: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface FileValidationResult {
  file: string;
  programs: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  duplicates: DuplicateEntry[];
  skipped: number;
}

export interface DuplicateEntry {
  id: string;
  files: string[];
}

export interface ValidValues {
  validGroups: string[];
  validCategories: string[];
  validCategoryIds: string[];
  validAreas: string[];
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface CityMapping {
  name: string;
  county: string;
}

export interface SuppressedProgram {
  id: string;
  reason?: string;
}

// ============================================================================
// GeoJSON Types
// ============================================================================

export interface GeoJsonFeature {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    category: string;
    description: string;
    address?: string;
    phone?: string;
    website?: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

// ============================================================================
// Constants
// ============================================================================

export const CATEGORY_IDS = [
  'community',
  'education',
  'equipment',
  'finance',
  'food',
  'health',
  'legal',
  'library-resources',
  'pet-resources',
  'recreation',
  'technology',
  'transportation',
  'utilities',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export const GROUP_IDS = [
  'income-eligible',
  'seniors',
  'youth',
  'college-students',
  'veterans',
  'families',
  'disability',
  'lgbtq',
  'first-responders',
  'teachers',
  'unemployed',
  'immigrants',
  'unhoused',
  'pregnant',
  'caregivers',
  'foster-youth',
  'reentry',
  'nonprofits',
  'everyone',
] as const;

export type GroupId = (typeof GROUP_IDS)[number];

export const AREA_TYPES = {
  'San Francisco': 'county',
  'Alameda County': 'county',
  'Contra Costa County': 'county',
  'Marin County': 'county',
  'Napa County': 'county',
  'San Mateo County': 'county',
  'Santa Clara County': 'county',
  'Solano County': 'county',
  'Sonoma County': 'county',
  'Bay Area': 'region',
  Statewide: 'state',
  Nationwide: 'nationwide',
} as const;

export type AreaName = keyof typeof AREA_TYPES;
