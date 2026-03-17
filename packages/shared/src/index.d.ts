export type LocationCategory = 'hot_spring' | 'cave' | 'waterfall';
export type Difficulty = 'easy' | 'moderate' | 'hard' | 'expert';
export type AccessType = 'free' | 'fee_required' | 'permit_required' | 'private';
export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'year_round';
export type Remoteness = 'urban' | 'suburban' | 'rural' | 'remote' | 'very_remote';
export type ListingStatus = 'pending' | 'approved' | 'rejected';
export type ReportType = 'location_inaccurate' | 'access_blocked' | 'temporarily_closed' | 'unsafe' | 'trail_washed_out' | 'private_property' | 'dangerous_conditions' | 'duplicate' | 'incorrect_info';
export type UserRole = 'user' | 'moderator' | 'admin';
export interface Warning {
    id: string;
    type: ReportType;
    message: string;
    reportedAt: string;
    resolvedAt?: string;
    active: boolean;
}
export interface HotSpringDetails {
    temperatureF?: number;
    tempRangeF?: {
        min: number;
        max: number;
    };
    naturalPool: boolean;
    developed: boolean;
    etiquetteNotes?: string;
    nudityPolicy?: 'clothing_required' | 'optional' | 'clothing_free';
}
export interface CaveDetails {
    caveType: 'limestone' | 'lava' | 'sea' | 'ice' | 'other';
    guided: boolean | 'required';
    equipmentNeeded?: string[];
    depthFt?: number;
    lengthFt?: number;
    formations?: string[];
    safetyNotes?: string;
}
export interface WaterfallDetails {
    heightFt?: number;
    flow: 'perennial' | 'seasonal' | 'intermittent';
    swimmingHole: boolean;
    viewableFromTrail: boolean;
    multiTiered: boolean;
}
export interface Location {
    id: string;
    title: string;
    category: LocationCategory;
    coordinates: {
        lat: number;
        lng: number;
    };
    primaryPhoto?: string;
    photos: string[];
    description: string;
    shortDescription: string;
    difficulty: Difficulty;
    accessType: AccessType;
    hikingDistanceMi?: number;
    hikingElevationFt?: number;
    terrain: string[];
    seasonality: Season[];
    familyFriendly: boolean;
    swimAllowed?: boolean;
    remoteness: Remoteness;
    warnings: Warning[];
    tags: string[];
    status: ListingStatus;
    submittedBy?: string;
    approvedBy?: string;
    createdAt: string;
    updatedAt: string;
    hotSpring?: HotSpringDetails;
    cave?: CaveDetails;
    waterfall?: WaterfallDetails;
    averageRating?: number;
    reviewCount?: number;
    state: string;
    county?: string;
    nearestCity?: string;
}
export interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    role: UserRole;
    savedLocations: string[];
    submittedLocations: string[];
    createdAt: string;
}
export interface Report {
    id: string;
    locationId: string;
    reportedBy: string;
    type: ReportType;
    description: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    createdAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    resolution?: string;
}
export interface LocationSubmission {
    id: string;
    title: string;
    category: LocationCategory;
    coordinates: {
        lat: number;
        lng: number;
    };
    description: string;
    photos?: string[];
    difficulty: Difficulty;
    accessType: AccessType;
    submittedBy: string;
    status: ListingStatus;
    createdAt: string;
    reviewNotes?: string;
}
export interface ApiResponse<T> {
    data: T;
    message?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}
export interface LocationsQuery {
    category?: LocationCategory;
    bounds?: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
    difficulty?: Difficulty;
    swimAllowed?: boolean;
    q?: string;
    page?: number;
    pageSize?: number;
}
