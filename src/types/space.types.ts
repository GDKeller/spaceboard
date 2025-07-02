export interface Astronaut {
  name: string;
  country: string;
  countryFlag: string;
  agency: string;
  position: string;
  spaceCraft: string;
  launchDate: number; // UNIX timestamp
  totalDaysInSpace: number;
  expeditionShort: string;
  expeditionLong: string;
  expeditionPatch: string;
  missionPatch: string;
  profileImageLink: string;
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