export interface Astronaut {
  name: string;
  country: string;
  countryFlag: string;
  agency: string;
  position: string;
  spaceCraft: string;
  craft?: string; // Alternative field name from server
  launchDate: number; // UNIX timestamp
  totalDaysInSpace: number;
  expeditionShort: string;
  expeditionLong: string;
  expeditionPatch: string;
  missionPatch: string;
  profileImageLink: string;
  profileImageThumbnail?: string;
  socialMediaPlatforms: {
    reddit?: string;
    youtube?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    tiktok?: string;
  };
  iss: boolean;
  launchVehicle: string;
  
  // Enhanced biographical data
  age?: number;
  bio?: string;
  nationality?: string;
  flightsCount?: number;
  spacewalksCount?: number;
  evaTime?: string;
  timeInSpace?: string;
  inSpace?: boolean;
  
  // Real-time status simulation
  currentActivity?: 'sleeping' | 'working' | 'eva' | 'exercise' | 'communication' | 'meal' | 'maintenance' | 'research';
  healthStatus?: 'nominal' | 'monitoring' | 'medical_attention';
  lastUpdate?: string;
  
  // Mission data
  currentMission?: {
    name: string;
    description: string;
    startDate: number;
    expectedDuration: number;
    status: 'active' | 'planned' | 'completed';
  };
  
  // Enhanced agency data
  agencyType?: string;
  agencyId?: number;
  
  // Tactical display fields
  role?: string;
  missionDay?: number;
  taskStatus?: 'MAINTENANCE' | 'COMMUNICATION' | 'WORKING' | 'REST';
  vitals?: {
    o2Sat: number;
    bpm: number;
    temp: number;
  };
}

export interface Spacecraft {
  spacecraftName: string;
  spacecraftCountryFlag: string;
  spacecraftCountry: string;
  spacecraftOperator: string;
  spacecraftOperatorFlag: string;
  totalDaysDocked: number;
  launchDate: number; // UNIX timestamp
  spacecraftType: string;
  spacecraftStatus: string;
  crewOnboard: number;
  crewCapacity: number;
  launchVehicle: string;
  missionPatch: string;
}

export interface SpaceData {
  numberOfPeople: number;
  expedition: {
    expeditionNumber: string;
    expeditionStartDate: number; // UNIX timestamp
    expeditionEndDate: number; // UNIX timestamp
  };
  astronauts: Astronaut[];
}

export interface SpacecraftData {
  spacecraftAtISS: number;
  dockedSpacecraft: Spacecraft[];
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface LoadingState {
  isLoading: boolean;
  error: ApiError | null;
}