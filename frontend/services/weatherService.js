/**
 * weatherService.js — fetches weather via backend proxy (avoids CORS).
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Fetch current weather for a lat/lng coordinate.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<WeatherData>}
 */
export async function fetchWeather(lat, lng) {
  const res = await fetch(`${BASE_URL}/api/weather?lat=${lat}&lng=${lng}`);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  return res.json();
}
