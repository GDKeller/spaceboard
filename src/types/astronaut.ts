export interface Astronaut {
  id: string;
  name: string;
  craft: string;
  nationality?: string;
  image_url?: string;
  bio?: string;
  status: AstronautStatus;
  mission?: Mission;
  eva_hours?: number;
  missions_count?: number;
  launch_date?: string;
  days_in_space?: number;
  agency?: SpaceAgency;
}

export interface AstronautStatus {
  current_activity: 'sleeping' | 'working' | 'eva' | 'exercise' | 'communication' | 'meal' | 'maintenance';
  health_status: 'nominal' | 'monitoring' | 'medical_attention';
  location: string;
  last_update: string;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  launch_date: string;
  expected_duration_days: number;
  status: 'planned' | 'active' | 'completed' | 'aborted';
}

export interface SpaceAgency {
  id: string;
  name: string;
  abbrev: string;
  country_code: string;
  logo_url?: string;
}

export interface AstronautBiometrics {
  astronaut_id: string;
  heart_rate: number;
  oxygen_saturation: number;
  body_temperature: number;
  stress_level: 'low' | 'normal' | 'elevated' | 'high';
  timestamp: string;
}