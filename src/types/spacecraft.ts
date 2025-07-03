export interface Spacecraft {
  id: string;
  name: string;
  type: 'station' | 'capsule' | 'shuttle' | 'probe' | 'rover';
  status: SpacecraftStatus;
  orbit?: Orbit;
  crew_capacity?: number;
  current_crew?: number;
  launch_date: string;
  manufacturer: string;
  country: string;
  image_url?: string;
}

export interface SpacecraftStatus {
  operational: boolean;
  power_level: number;
  solar_panel_status?: 'deployed' | 'stowed' | 'damaged';
  communication_status: 'nominal' | 'intermittent' | 'lost';
  life_support_status?: 'nominal' | 'backup' | 'critical';
  last_contact: string;
}

export interface SpaceStation extends Spacecraft {
  modules: StationModule[];
  docking_ports: DockingPort[];
  experiments_active: number;
  total_mass_kg: number;
  habitable_volume_m3: number;
}

export interface StationModule {
  id: string;
  name: string;
  purpose: string;
  status: 'operational' | 'maintenance' | 'damaged';
  added_date: string;
}

export interface DockingPort {
  id: string;
  name: string;
  occupied: boolean;
  docked_vehicle?: string;
  compatible_vehicles: string[];
}