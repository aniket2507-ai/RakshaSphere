'use strict';
/**
 * Predictions API — /api/predictions
 * Returns sample district-level safety predictions with trend data.
 */
const { Router } = require('express');
const router = Router();

const SAMPLE_PREDICTIONS = [
  { district: 'LUCKNOW', state: 'UTTAR PRADESH', lat: 26.8467, lng: 80.9462, currentScore: 42, predictedScore: 38, trend: 'falling', trendLabel: 'Improving', classification: 'Moderate', predictedClassification: 'Low', safetyRating: 6.2, confidence: 0.87, topRisks: ['Theft', 'Assault on Women', 'Robbery'], safestAreas: ['Gomti Nagar', 'Hazratganj', 'Aliganj'], avoidAreas: ['Chowk', 'Aminabad', 'Kaiserbagh'], crimeReduction: 12, yearOverYear: -8, prediction2025: 35, prediction2026: 31 },
  { district: 'KANPUR NAGAR', state: 'UTTAR PRADESH', lat: 26.4499, lng: 80.3319, currentScore: 71, predictedScore: 74, trend: 'rising', trendLabel: 'Worsening', classification: 'High', predictedClassification: 'High', safetyRating: 3.8, confidence: 0.91, topRisks: ['Murder', 'Robbery', 'Kidnapping', 'Dacoity'], safestAreas: ['Civil Lines', 'Swaroop Nagar'], avoidAreas: ['Kidwai Nagar', 'Govind Nagar', 'Armapur'], crimeReduction: -5, yearOverYear: 6, prediction2025: 76, prediction2026: 79 },
  { district: 'VARANASI', state: 'UTTAR PRADESH', lat: 25.3176, lng: 82.9739, currentScore: 55, predictedScore: 51, trend: 'falling', trendLabel: 'Improving', classification: 'Moderate', predictedClassification: 'Moderate', safetyRating: 5.1, confidence: 0.83, topRisks: ['Theft', 'Riots', 'Assault on Women'], safestAreas: ['Sigra', 'Lanka', 'BHU Campus'], avoidAreas: ['Godowlia', 'Dashashwamedh Ghat at night'], crimeReduction: 7, yearOverYear: -4, prediction2025: 49, prediction2026: 46 },
  { district: 'AGRA', state: 'UTTAR PRADESH', lat: 27.1767, lng: 78.0081, currentScore: 63, predictedScore: 60, trend: 'stable', trendLabel: 'Stable', classification: 'Moderate', predictedClassification: 'Moderate', safetyRating: 4.7, confidence: 0.79, topRisks: ['Robbery', 'Theft', 'Kidnapping'], safestAreas: ['Kamla Nagar', 'Shahganj'], avoidAreas: ['Mantola', 'Lohamandi', 'Taj Ganj at night'], crimeReduction: 3, yearOverYear: -2, prediction2025: 59, prediction2026: 57 },
  { district: 'MEERUT', state: 'UTTAR PRADESH', lat: 28.9845, lng: 77.7064, currentScore: 68, predictedScore: 65, trend: 'falling', trendLabel: 'Improving', classification: 'High', predictedClassification: 'Moderate', safetyRating: 4.1, confidence: 0.85, topRisks: ['Riots', 'Murder', 'Robbery'], safestAreas: ['Shastri Nagar', 'Pallavpuram'], avoidAreas: ['Hapur Road', 'Lisari Gate', 'Budhana Gate'], crimeReduction: 9, yearOverYear: -5, prediction2025: 62, prediction2026: 58 },
  { district: 'GHAZIABAD', state: 'UTTAR PRADESH', lat: 28.6692, lng: 77.4538, currentScore: 29, predictedScore: 26, trend: 'falling', trendLabel: 'Improving', classification: 'Low', predictedClassification: 'Low', safetyRating: 7.8, confidence: 0.88, topRisks: ['Theft', 'Cheating'], safestAreas: ['Indirapuram', 'Vaishali', 'Raj Nagar Extension'], avoidAreas: [], crimeReduction: 18, yearOverYear: -11, prediction2025: 24, prediction2026: 21 },
  { district: 'ALLAHABAD', state: 'UTTAR PRADESH', lat: 25.4358, lng: 81.8463, currentScore: 58, predictedScore: 55, trend: 'stable', trendLabel: 'Stable', classification: 'Moderate', predictedClassification: 'Moderate', safetyRating: 5.0, confidence: 0.81, topRisks: ['Theft', 'Assault on Women', 'Burglary'], safestAreas: ['Civil Lines', 'George Town', 'Naini'], avoidAreas: ['Atala', 'Kareli', 'Bahadurganj'], crimeReduction: 4, yearOverYear: -3, prediction2025: 53, prediction2026: 51 },
  { district: 'GORAKHPUR', state: 'UTTAR PRADESH', lat: 26.7606, lng: 83.3732, currentScore: 47, predictedScore: 44, trend: 'falling', trendLabel: 'Improving', classification: 'Moderate', predictedClassification: 'Moderate', safetyRating: 5.8, confidence: 0.80, topRisks: ['Kidnapping', 'Robbery', 'Theft'], safestAreas: ['Rapti Nagar', 'Mohaddipur'], avoidAreas: ['Golghar at night', 'Railway Station surroundings'], crimeReduction: 8, yearOverYear: -5, prediction2025: 42, prediction2026: 39 },
  { district: 'NEW DELHI', state: 'DELHI', lat: 28.6139, lng: 77.2090, currentScore: 35, predictedScore: 33, trend: 'falling', trendLabel: 'Improving', classification: 'Moderate', predictedClassification: 'Low', safetyRating: 6.9, confidence: 0.92, topRisks: ['Theft', 'Cheating', 'Assault on Women'], safestAreas: ['Lutyens Delhi', 'Chanakyapuri', 'Vasant Vihar'], avoidAreas: ['Paharganj at night', 'Old Delhi lanes'], crimeReduction: 14, yearOverYear: -7, prediction2025: 31, prediction2026: 28 },
  { district: 'NORTH EAST DELHI', state: 'DELHI', lat: 28.6900, lng: 77.3000, currentScore: 78, predictedScore: 75, trend: 'falling', trendLabel: 'Slowly Improving', classification: 'High', predictedClassification: 'High', safetyRating: 3.2, confidence: 0.89, topRisks: ['Riots', 'Murder', 'Robbery', 'Assault on Women'], safestAreas: ['Dilshad Garden', 'Vivek Vihar'], avoidAreas: ['Mustafabad', 'Bhajanpura', 'Karawal Nagar at night'], crimeReduction: -2, yearOverYear: 3, prediction2025: 73, prediction2026: 70 },
  { district: 'SOUTH DELHI', state: 'DELHI', lat: 28.5200, lng: 77.2200, currentScore: 22, predictedScore: 20, trend: 'falling', trendLabel: 'Improving', classification: 'Low', predictedClassification: 'Low', safetyRating: 8.4, confidence: 0.90, topRisks: ['Theft', 'Cheating'], safestAreas: ['Saket', 'Hauz Khas', 'Greater Kailash'], avoidAreas: [], crimeReduction: 20, yearOverYear: -9, prediction2025: 18, prediction2026: 16 },
  { district: 'BAREILLY', state: 'UTTAR PRADESH', lat: 28.3670, lng: 79.4304, currentScore: 61, predictedScore: 58, trend: 'stable', trendLabel: 'Stable', classification: 'Moderate', predictedClassification: 'Moderate', safetyRating: 4.9, confidence: 0.78, topRisks: ['Robbery', 'Kidnapping', 'Theft'], safestAreas: ['Civil Lines', 'Subhash Nagar'], avoidAreas: ['Kotwali area at night', 'Pilibhit Bypass'], crimeReduction: 5, yearOverYear: -3, prediction2025: 56, prediction2026: 54 },
];

router.get('/', (req, res) => {
  const { state, classification, limit } = req.query;
  let data = [...SAMPLE_PREDICTIONS];
  if (state) data = data.filter(d => d.state.toLowerCase().includes(state.toLowerCase()));
  if (classification) data = data.filter(d => d.classification.toLowerCase() === classification.toLowerCase());
  if (limit) data = data.slice(0, parseInt(limit, 10));
  res.json({ predictions: data, total: data.length });
});

router.get('/:district', (req, res) => {
  const name = req.params.district.toUpperCase().replace(/-/g, ' ');
  const found = SAMPLE_PREDICTIONS.find(d => d.district === name);
  if (!found) return res.status(404).json({ error: 'NOT_FOUND', district: name });
  res.json(found);
});

module.exports = router;
