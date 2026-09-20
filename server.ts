import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy for weather forecast
  app.get('/api/weather', async (req, res) => {
    try {
      const { latitude, longitude, hourly, temperature_unit, wind_speed_unit, timezone, forecast_days } = req.query;
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=${hourly || 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m'}&temperature_unit=${temperature_unit || 'fahrenheit'}&wind_speed_unit=${wind_speed_unit || 'mph'}&timezone=${timezone || 'auto'}&forecast_days=${forecast_days || '7'}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ error: `Weather API returned status ${response.status}` });
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Server proxy weather error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch weather data' });
    }
  });

  // Proxy for search geocoding
  app.get('/api/geocode-search', async (req, res) => {
    try {
      const { name, count, language, format } = req.query;
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(String(name))}&count=${count || '5'}&language=${language || 'en'}&format=${format || 'json'}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ error: `Geocoding API returned status ${response.status}` });
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Server proxy geocode search error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch geocoding data' });
    }
  });

  // Proxy for reverse geocoding
  app.get('/api/geocode-reverse', async (req, res) => {
    try {
      const { lat, lon, format } = req.query;
      if (!lat || !lon) {
        return res.status(400).json({ error: 'Lat and lon are required' });
      }

      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=${format || 'json'}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BikeCommuteWeatherApp/1.0 (andyzhan211@gmail.com)'
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: `Reverse geocoding returned status ${response.status}` });
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Server proxy geocode reverse error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch reverse geocoding data' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
