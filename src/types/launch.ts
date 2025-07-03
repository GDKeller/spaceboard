export interface Launch {
  id: string;
  name: string;
  status: LaunchStatus;
  net: string; // No Earlier Than - launch time
  window_start: string;
  window_end: string;
  launch_service_provider: LaunchProvider;
  rocket: Rocket;
  mission: LaunchMission;
  pad: LaunchPad;
  webcast_live: boolean;
  webcast_url?: string;
  image_url?: string;
  infographic_url?: string;
}

export interface LaunchStatus {
  id: number;
  name: 'Go' | 'TBD' | 'Success' | 'Failure' | 'Hold' | 'In Flight' | 'Partial Failure';
  abbrev: string;
  description: string;
}

export interface LaunchProvider {
  id: number;
  name: string;
  type: 'Government' | 'Commercial' | 'Multinational';
  country_code: string;
  abbrev: string;
  logo_url?: string;
}

export interface Rocket {
  id: number;
  configuration: RocketConfiguration;
  reused: boolean;
  serial_number?: string;
  previous_flights?: number;
}

export interface RocketConfiguration {
  id: number;
  name: string;
  family: string;
  full_name: string;
  variant: string;
  reusable: boolean;
  stages: number;
  boosters: number;
  launch_mass_kg?: number;
  leo_capacity_kg?: number;
  gto_capacity_kg?: number;
  success_rate?: number;
}

export interface LaunchMission {
  id: number;
  name: string;
  description: string;
  type: 'Communications' | 'Earth Science' | 'Planetary Science' | 'Astrophysics' | 'Heliophysics' | 'Human Exploration' | 'Robotic Exploration' | 'Tourism' | 'Military' | 'Test Flight';
  orbit: OrbitType;
  payloads: Payload[];
}

export interface OrbitType {
  id: number;
  name: string;
  abbrev: string;
}

export interface Payload {
  id: string;
  name: string;
  customer: string;
  manufacturer: string;
  mass_kg?: number;
  orbit: string;
}

export interface LaunchPad {
  id: number;
  name: string;
  location: {
    name: string;
    country_code: string;
    latitude: number;
    longitude: number;
  };
  complex: string;
  status: 'active' | 'inactive' | 'under_construction' | 'retired';
}