'use strict';

/**
 * Weather API proxy — /api/weather
 * Proxies OpenWeatherMap to avoid browser CORS issues.
 */

const { Router } = require('express');
const https = require('https');

const router = Router();
const OWM_KEY = process.env.OWM_API_KEY || 'a7a11d01e59d9e9ef352614f5ee2fda8';

/**
 * GET /api/weather?lat=&lng=
 */
router.get('/', (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OWM_KEY}&units=metric`;

  https.get(url, (owmRes) => {
    let raw = '';
    owmRes.on('data', chunk => { raw += chunk; });
    owmRes.on('end', () => {
      try {
        const d = JSON.parse(raw);
        if (owmRes.statusCode !== 200) {
          return res.status(owmRes.statusCode).json({ error: d.message || 'OWM error' });
        }
        res.json({
          temp:        Math.round(d.main.temp),
          feelsLike:   Math.round(d.main.feels_like),
          humidity:    d.main.humidity,
          windSpeed:   Math.round(d.wind.speed * 3.6),
          description: d.weather[0].description,
          icon:        d.weather[0].icon,
          iconUrl:     `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`,
          city:        d.name,
          country:     d.sys.country,
          visibility:  d.visibility ? Math.round(d.visibility / 1000) : null,
          pressure:    d.main.pressure,
        });
      } catch (e) {
        res.status(500).json({ error: 'Parse error' });
      }
    });
  }).on('error', (e) => {
    res.status(502).json({ error: e.message });
  });
});

module.exports = router;
