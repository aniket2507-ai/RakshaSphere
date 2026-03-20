/**
 * Frontend Groq validation helper.
 * Calls /api/groq/validate to check report text for spam/gibberish/abuse.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * @param {{ title: string, description: string, city: string }} fields
 * @returns {Promise<{ valid: boolean, reason: string|null, flags: string[] }>}
 */
export async function validateWithGroq({ title, description, city }) {
  try {
    const res = await fetch(`${BASE_URL}/api/groq/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, city }),
    });
    if (!res.ok) return { valid: true, reason: null, flags: [] };
    return await res.json();
  } catch {
    return { valid: true, reason: null, flags: [] };
  }
}
