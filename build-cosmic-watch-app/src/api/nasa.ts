import axios from 'axios';
import { format, addDays } from 'date-fns';

const API_KEY = 'DEMO_KEY';
const BASE_URL = 'https://api.nasa.gov/neo/rest/v1';

// Simple cache to prevent multiple requests
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

// Mock asteroid data for when API is rate limited
const MOCK_ASTEROIDS: Asteroid[] = [
  {
    id: '2142257',
    name: '(2007 FD10)',
    is_potentially_hazardous_asteroid: true,
    absolute_magnitude_h: 22.5,
    estimated_diameter: {
      kilometers: {
        estimated_diameter_min: 0.134,
        estimated_diameter_max: 0.3,
      },
    },
    close_approach_data: [
      {
        close_approach_date: '2026-02-15',
        close_approach_date_full: '2026-Feb-15 09:45',
        epoch_date_close_approach: 1739613900000,
        relative_velocity: {
          kilometers_per_second: '18.5',
          kilometers_per_hour: '66600',
          miles_per_hour: '41400',
        },
        miss_distance: {
          astronomical: '0.0456',
          lunar: '17.74',
          kilometers: '6820000',
          miles: '4240000',
        },
        orbiting_body: 'Earth',
      },
    ],
    orbital_data: {},
    risk_score: 62,
    risk_level: 'High',
  },
  {
    id: '2159695',
    name: '(2007 PA8)',
    is_potentially_hazardous_asteroid: true,
    absolute_magnitude_h: 20.1,
    estimated_diameter: {
      kilometers: {
        estimated_diameter_min: 0.354,
        estimated_diameter_max: 0.791,
      },
    },
    close_approach_data: [
      {
        close_approach_date: '2026-02-20',
        close_approach_date_full: '2026-Feb-20 14:30',
        epoch_date_close_approach: 1740076200000,
        relative_velocity: {
          kilometers_per_second: '22.3',
          kilometers_per_hour: '80280',
          miles_per_hour: '49900',
        },
        miss_distance: {
          astronomical: '0.0821',
          lunar: '31.94',
          kilometers: '12280000',
          miles: '7630000',
        },
        orbiting_body: 'Earth',
      },
    ],
    orbital_data: {},
    risk_score: 55,
    risk_level: 'Medium',
  },
  {
    id: '3671668',
    name: '(2013 RY24)',
    is_potentially_hazardous_asteroid: false,
    absolute_magnitude_h: 23.8,
    estimated_diameter: {
      kilometers: {
        estimated_diameter_min: 0.075,
        estimated_diameter_max: 0.168,
      },
    },
    close_approach_data: [
      {
        close_approach_date: '2026-02-18',
        close_approach_date_full: '2026-Feb-18 06:15',
        epoch_date_close_approach: 1739887500000,
        relative_velocity: {
          kilometers_per_second: '19.7',
          kilometers_per_hour: '70920',
          miles_per_hour: '44100',
        },
        miss_distance: {
          astronomical: '0.1245',
          lunar: '48.43',
          kilometers: '18620000',
          miles: '11570000',
        },
        orbiting_body: 'Earth',
      },
    ],
    orbital_data: {},
    risk_score: 28,
    risk_level: 'Low',
  },
  {
    id: '3860210',
    name: '(2015 BX509)',
    is_potentially_hazardous_asteroid: true,
    absolute_magnitude_h: 21.2,
    estimated_diameter: {
      kilometers: {
        estimated_diameter_min: 0.226,
        estimated_diameter_max: 0.506,
      },
    },
    close_approach_data: [
      {
        close_approach_date: '2026-02-22',
        close_approach_date_full: '2026-Feb-22 18:45',
        epoch_date_close_approach: 1740263100000,
        relative_velocity: {
          kilometers_per_second: '21.1',
          kilometers_per_hour: '75960',
          miles_per_hour: '47200',
        },
        miss_distance: {
          astronomical: '0.0634',
          lunar: '24.66',
          kilometers: '9485000',
          miles: '5895000',
        },
        orbiting_body: 'Earth',
      },
    ],
    orbital_data: {},
    risk_score: 58,
    risk_level: 'Medium',
  },
  ...Array.from({ length: 46 }, (_, i) => ({
    id: String(2000000 + i),
    name: `(${2026 - Math.floor(i / 5)}-${String.fromCharCode(65 + (i % 5))}${String((i + 1) % 10)})`,
    is_potentially_hazardous_asteroid: Math.random() > 0.6,
    absolute_magnitude_h: 18 + Math.random() * 8,
    estimated_diameter: {
      kilometers: {
        estimated_diameter_min: 0.05 + Math.random() * 0.5,
        estimated_diameter_max: 0.3 + Math.random() * 2,
      },
    },
    close_approach_data: [
      {
        close_approach_date: `2026-02-${(10 + (i % 20)).toString().padStart(2, '0')}`,
        close_approach_date_full: `2026-Feb-${(10 + (i % 20)).toString().padStart(2, '0')} ${String((i * 7) % 24).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
        epoch_date_close_approach: 1739000000000 + i * 86400000,
        relative_velocity: {
          kilometers_per_second: ((15 + Math.random() * 30).toFixed(1)),
          kilometers_per_hour: String((54000 + Math.random() * 100000).toFixed(0)),
          miles_per_hour: String((33500 + Math.random() * 65000).toFixed(0)),
        },
        miss_distance: {
          astronomical: ((0.02 + Math.random() * 0.2).toFixed(4)),
          lunar: ((8 + Math.random() * 60).toFixed(2)),
          kilometers: String((3000000 + Math.random() * 30000000).toFixed(0)),
          miles: String((1850000 + Math.random() * 18600000).toFixed(0)),
        },
        orbiting_body: 'Earth',
      },
    ],
    orbital_data: {},
    risk_score: Math.floor(20 + Math.random() * 75),
    risk_level: (['Low', 'Medium', 'High'] as const)[Math.floor(Math.random() * 3)],
  }))
];

export interface Asteroid {
  id: string;
  name: string;
  is_potentially_hazardous_asteroid: boolean;
  absolute_magnitude_h: number;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  close_approach_data: Array<{
    close_approach_date: string;
    close_approach_date_full: string;
    epoch_date_close_approach: number;
    relative_velocity: {
      kilometers_per_second: string;
      kilometers_per_hour: string;
      miles_per_hour: string;
    };
    miss_distance: {
      astronomical: string;
      lunar: string;
      kilometers: string;
      miles: string;
    };
    orbiting_body: string;
  }>;
  orbital_data?: any;
  // Custom properties for our app
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
}

function calculateRisk(asteroid: any): { score: number; level: 'Low' | 'Medium' | 'High' } {
  let score = 0;
  
  // Factor 1: Hazardous flag (+40 points if true)
  if (asteroid.is_potentially_hazardous_asteroid) {
    score += 40;
  }
  
  // Factor 2: Size (Max +30 points)
  const avgDiameter = (asteroid.estimated_diameter.kilometers.estimated_diameter_min + asteroid.estimated_diameter.kilometers.estimated_diameter_max) / 2;
  // Typical asteroid is ~0.1km. Scale up to 1km = 30 points
  score += Math.min(30, avgDiameter * 30);
  
  // Factor 3: Miss Distance (Max +30 points)
  const closeApproach = asteroid.close_approach_data[0];
  if (closeApproach) {
    const missDistLunar = parseFloat(closeApproach.miss_distance.lunar);
    // 0 lunar distance = 30 points, > 50 lunar distances = 0 points
    score += Math.max(0, 30 - (missDistLunar / 50) * 30);
  }
  
  score = Math.round(score);
  
  let level: 'Low' | 'Medium' | 'High' = 'Low';
  if (score >= 65) level = 'High';
  else if (score >= 35) level = 'Medium';
  
  return { score, level };
}

export const fetchNeoFeed = async (): Promise<Asteroid[]> => {
  const cacheKey = 'neoFeed';
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  const startDate = format(new Date(), 'yyyy-MM-dd');
  // NASA NeoWs feed max limit is 7 days
  const endDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  try {
    const response = await axios.get(`${BASE_URL}/feed`, {
      params: {
        start_date: startDate,
        end_date: endDate,
        api_key: API_KEY,
      },
    });

    const nearEarthObjects = response.data.near_earth_objects;
    const allAsteroids: Asteroid[] = [];

    // Flatten the date-indexed object into a single array
    Object.keys(nearEarthObjects).forEach((date) => {
      nearEarthObjects[date].forEach((ast: any) => {
        const risk = calculateRisk(ast);
        allAsteroids.push({
          ...ast,
          risk_score: risk.score,
          risk_level: risk.level,
        });
      });
    });

    // Sort by risk score descending
    const sorted = allAsteroids.sort((a, b) => b.risk_score - a.risk_score);
    
    // Cache the result
    cache.set(cacheKey, { data: sorted, timestamp: Date.now() });
    
    return sorted;
  } catch (error) {
    console.error('Error fetching NASA NEO Feed, using mock data:', error);
    // Return mock data as fallback
    const sorted = MOCK_ASTEROIDS.sort((a, b) => b.risk_score - a.risk_score);
    cache.set(cacheKey, { data: sorted, timestamp: Date.now() });
    return sorted;
  }
};

export const fetchAsteroidDetails = async (id: string): Promise<Asteroid> => {
  const cacheKey = `asteroid_${id}`;
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  try {
    const response = await axios.get(`${BASE_URL}/neo/${id}`, {
      params: { api_key: API_KEY },
    });
    const ast = response.data;
    const risk = calculateRisk(ast);
    const asteroid = {
      ...ast,
      risk_score: risk.score,
      risk_level: risk.level,
    };
    
    // Cache the result
    cache.set(cacheKey, { data: asteroid, timestamp: Date.now() });
    
    return asteroid;
  } catch (error) {
    console.error(`Error fetching asteroid ${id}:`, error);
    // Try to find in mock data
    const mockAsteroid = MOCK_ASTEROIDS.find(a => a.id === id);
    if (mockAsteroid) {
      cache.set(cacheKey, { data: mockAsteroid, timestamp: Date.now() });
      return mockAsteroid;
    }
    throw error;
  }
};
