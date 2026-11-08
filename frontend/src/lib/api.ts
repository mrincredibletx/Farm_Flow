import { TerrainAnalysisResponse, SampleField, SearchResult } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function analyzeTerrain(
  coordinates: [number, number][],
  gridResolution: number = 20
): Promise<TerrainAnalysisResponse> {
  const url = `${API_BASE}/api/v1/analyze-terrain`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coordinates,
      grid_resolution: gridResolution,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Analysis failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchSampleFields(): Promise<SampleField[]> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/sample-fields`);
    if (response.ok) {
      const data = await response.json();
      return data.fields || [];
    }
  } catch (err) {
    console.warn('Could not fetch sample fields from API, using fallback defaults', err);
  }

  // Built-in client fallback in case backend is starting
  return [
    {
      id: 'uem-jaipur-demo',
      name: 'UEM Jaipur Agritech Research Plot',
      location: 'Jaipur, Rajasthan',
      description: 'Undulating terrain with natural run-off channels near the Aravalli foothills.',
      center: [75.9255, 26.9832],
      zoom: 17,
      coordinates: [
        [75.9238, 26.9845],
        [75.9272, 26.9848],
        [75.9278, 26.9818],
        [75.9242, 26.9815],
        [75.9238, 26.9845],
      ],
    },
    {
      id: 'punjab-paddy-demo',
      name: 'Punjab Lowland Farm',
      location: 'Ludhiana, Punjab',
      description: 'Intensive alluvial plains vulnerable to seasonal post-monsoon ponding.',
      center: [75.8570, 30.9010],
      zoom: 17,
      coordinates: [
        [75.8550, 30.9025],
        [75.8590, 30.9028],
        [75.8595, 30.8995],
        [75.8552, 30.8992],
        [75.8550, 30.9025],
      ],
    },
    {
      id: 'haryana-swale-demo',
      name: 'Haryana Terraced Crop Basin',
      location: 'Karnal, Haryana',
      description: 'Graded agricultural field with a central micro-depression zone.',
      center: [76.9920, 29.6880],
      zoom: 17,
      coordinates: [
        [76.9900, 29.6895],
        [76.9940, 29.6898],
        [76.9945, 29.6865],
        [76.9902, 29.6862],
        [76.9900, 29.6895],
      ],
    },
  ];
}

export async function searchLocation(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&limit=5`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });
    if (response.ok) {
      return response.json();
    }
  } catch (err) {
    console.error('Geocoding search failed:', err);
  }
  return [];
}

