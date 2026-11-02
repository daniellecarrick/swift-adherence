import type { Office, Region } from './types';

const o = (city: string, country: string, region: Region, isHQ = false): Office => ({
  id: city.toLowerCase().replace(/[^a-z]+/g, '-'),
  city,
  country,
  region,
  isHQ,
});

// A fictional Swift Bank footprint. Cities are real banking hubs; the network is invented.
// The full case study lists 129 offices; this prototype loads the ones its personas use plus a sample of the rest.
export const OFFICES: Office[] = [
  o('New York', 'United States', 'North America', true),
  o('Jersey City', 'United States', 'North America'),
  o('Chicago', 'United States', 'North America'),
  o('Boston', 'United States', 'North America'),
  o('Charlotte', 'United States', 'North America'),
  o('San Francisco', 'United States', 'North America'),
  o('Toronto', 'Canada', 'North America'),
  o('Mexico City', 'Mexico', 'Latin America'),
  o('São Paulo', 'Brazil', 'Latin America'),
  o('Rio de Janeiro', 'Brazil', 'Latin America'),
  o('Bogotá', 'Colombia', 'Latin America'),
  o('Santiago', 'Chile', 'Latin America'),
  o('London', 'United Kingdom', 'EMEA'),
  o('Frankfurt', 'Germany', 'EMEA'),
  o('Dublin', 'Ireland', 'EMEA'),
  o('Paris', 'France', 'EMEA'),
  o('Madrid', 'Spain', 'EMEA'),
  o('Zurich', 'Switzerland', 'EMEA'),
  o('Dubai', 'United Arab Emirates', 'EMEA'),
  o('Singapore', 'Singapore', 'APAC'),
  o('Hong Kong', 'Hong Kong', 'APAC'),
  o('Tokyo', 'Japan', 'APAC'),
  o('Sydney', 'Australia', 'APAC'),
  o('Mumbai', 'India', 'APAC'),
];

export const OFFICE_BY_ID = Object.fromEntries(OFFICES.map((x) => [x.id, x])) as Record<string, Office>;
export const officeId = (city: string) => city.toLowerCase().replace(/[^a-z]+/g, '-');
