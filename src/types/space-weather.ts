export interface SpaceWeather {
  timestamp: string;
  solar_flux: SolarFlux;
  geomagnetic: GeomagneticActivity;
  radiation: RadiationLevels;
  alerts: SpaceWeatherAlert[];
}

export interface SolarFlux {
  value: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  last_flare?: SolarFlare;
  sunspot_count: number;
  solar_wind_speed: number;
  solar_wind_density: number;
}

export interface SolarFlare {
  class: 'A' | 'B' | 'C' | 'M' | 'X';
  scale: number;
  peak_time: string;
  start_time: string;
  end_time?: string;
  location: string;
  active_region: number;
}

export interface GeomagneticActivity {
  kp_index: number;
  ap_index: number;
  storm_level: 'none' | 'minor' | 'moderate' | 'strong' | 'severe' | 'extreme';
  aurora_visibility_lat: number;
}

export interface RadiationLevels {
  proton_flux: number;
  electron_flux: number;
  cosmic_ray_intensity: number;
  radiation_belt_status: 'nominal' | 'enhanced' | 'storm';
}

export interface SpaceWeatherAlert {
  id: string;
  type: 'solar_flare' | 'geomagnetic_storm' | 'radiation_storm' | 'radio_blackout';
  severity: 'minor' | 'moderate' | 'strong' | 'severe' | 'extreme';
  message: string;
  issued_time: string;
  valid_from: string;
  valid_to: string;
  regions_affected?: string[];
}

export interface SpaceDebris {
  id: string;
  name: string;
  type: 'defunct_satellite' | 'rocket_body' | 'fragmentation_debris' | 'mission_related';
  size_m: number;
  mass_kg?: number;
  orbit: Orbit;
  rcs?: number; // Radar Cross Section
  country_of_origin?: string;
  launch_date?: string;
  decay_date?: string;
}

export interface CollisionRisk {
  primary_object: string;
  secondary_object: string;
  time_of_closest_approach: string;
  miss_distance_m: number;
  probability_of_collision: number;
  combined_mass_kg: number;
  relative_velocity_ms: number;
  risk_level: 'low' | 'medium' | 'high' | 'very_high';
}

export interface NEO {
  id: string;
  name: string;
  designation: string;
  absolute_magnitude: number;
  estimated_diameter: {
    min_km: number;
    max_km: number;
  };
  is_potentially_hazardous: boolean;
  close_approach_data: CloseApproach[];
  orbital_data: NEOOrbit;
}

export interface CloseApproach {
  date: string;
  velocity_kms: number;
  miss_distance_km: number;
  miss_distance_lunar: number;
}

export interface NEOOrbit {
  orbit_class: string;
  perihelion_distance_au: number;
  aphelion_distance_au: number;
  eccentricity: number;
  inclination_deg: number;
  orbital_period_days: number;
}