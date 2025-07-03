export interface Orbit {
  epoch: string;
  mean_motion: number;
  eccentricity: number;
  inclination: number;
  ra_of_asc_node: number;
  arg_of_pericenter: number;
  mean_anomaly: number;
  ephemeris_type: number;
  classification_type: string;
  norad_cat_id: number;
  element_set_no: number;
  rev_at_epoch: number;
  bstar: number;
  mean_motion_dot: number;
  mean_motion_ddot: number;
}

export interface OrbitalPosition {
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude_km: number;
  velocity_kms: number;
  footprint_radius_km: number;
  solar_angle: number;
  visibility: 'daylight' | 'eclipse' | 'penumbra';
}

export interface TLE {
  line1: string;
  line2: string;
  name: string;
  updated: string;
}

export interface OrbitalPass {
  start_time: string;
  end_time: string;
  max_elevation: number;
  start_azimuth: number;
  end_azimuth: number;
  duration_seconds: number;
  visible: boolean;
}

export interface TrajectoryPoint {
  time: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  velocity: {
    x: number;
    y: number;
    z: number;
  };
}