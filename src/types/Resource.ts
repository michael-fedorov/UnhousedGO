export type ResourceType =
  | 'RESTROOM'
  | 'WATER'
  | 'SHOWER'
  | 'WIFI_OUTLET'
  | 'SHELTER'
  | 'FOOD'
  | 'BUS_STOP'
  | 'HOSPITAL';

export interface ResourceHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  note?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  hours?: ResourceHours | string;
  phone?: string;
  notes?: string;
}
