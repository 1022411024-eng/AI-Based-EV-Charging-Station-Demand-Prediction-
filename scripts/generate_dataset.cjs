const fs = require('fs');
const path = require('path');

const stations = [
  { id: 'stn_001', name: 'Downtown Financial Hub Alpha', city: 'San Francisco', lat: 37.7925, lng: -122.4014, base_occupancy: 68, base_power: 120, chargers: 16, base_temp: 17, rain_prob: 0.15 },
  { id: 'stn_002', name: 'Silicon Valley Innovation Supercharger', city: 'San Jose', lat: 37.3205, lng: -121.9482, base_occupancy: 82, base_power: 150, chargers: 24, base_temp: 24, rain_prob: 0.08 },
  { id: 'stn_003', name: 'Metro Transit Plaza & Depot', city: 'Oakland', lat: 37.8044, lng: -122.2711, base_occupancy: 45, base_power: 75, chargers: 12, base_temp: 15, rain_prob: 0.28 },
  { id: 'stn_004', name: 'South Lake Union Fleet Hub', city: 'Seattle', lat: 47.6253, lng: -122.3388, base_occupancy: 74, base_power: 110, chargers: 20, base_temp: 12, rain_prob: 0.35 },
  { id: 'stn_005', name: 'Barton Springs Green Mobility Hub', city: 'Austin', lat: 30.2642, lng: -97.7714, base_occupancy: 58, base_power: 90, chargers: 14, base_temp: 31, rain_prob: 0.12 },
  { id: 'stn_006', name: 'Midtown West Commercial Depot', city: 'New York', lat: 40.7605, lng: -73.9981, base_occupancy: 88, base_power: 160, chargers: 28, base_temp: 19, rain_prob: 0.20 },
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const rows = ['station_id,station_name,city,latitude,longitude,timestamp,occupancy_rate,power_kw,temperature,is_raining,day_of_week,hour'];

// Generate 21 days of hourly records across 6 stations = 3,024 samples
const startDate = new Date('2026-09-01T00:00:00Z');

for (let day = 0; day < 21; day++) {
  const currentDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
  const dayOfWeek = daysOfWeek[currentDate.getUTCDay() === 0 ? 6 : currentDate.getUTCDay() - 1];
  const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
  const weekendMultiplier = isWeekend ? 0.82 : 1.06;

  for (let hour = 0; hour < 24; hour++) {
    const timestampStr = `${currentDate.toISOString().slice(0, 10)} ${String(hour).padStart(2, '0')}:00:00`;

    // Diurnal commute curve
    let hourFactor = 0.35;
    if (hour >= 6 && hour <= 9) {
      hourFactor = 1.35 + (hour === 8 ? 0.18 : 0);
    } else if (hour >= 10 && hour <= 15) {
      hourFactor = 0.88 + Math.sin((hour - 10) / 5) * 0.14;
    } else if (hour >= 16 && hour <= 20) {
      hourFactor = 1.48 + (hour === 18 ? 0.20 : 0);
    } else if (hour >= 21) {
      hourFactor = 0.65 - (hour - 21) * 0.1;
    }

    for (const stn of stations) {
      const isRaining = Math.sin(day * 2.1 + stn.rain_prob * 10) > (1 - stn.rain_prob * 2) ? 1 : 0;
      const rainMultiplier = isRaining ? 1.12 : 1.0;

      // Diurnal temperature swing
      const tempSwing = Math.sin(((hour - 8) / 24) * 2 * Math.PI) * 4.5;
      const temp = Number((stn.base_temp + tempSwing + (Math.sin(day) * 2)).toFixed(1));

      // Realistic noise
      const pseudoNoise = (Math.sin(day * 4.3 + hour * 1.7 + stn.base_occupancy) * 0.08) + 
                          (Math.cos(hour * 2.1) * 0.04);
      
      const rawOcc = stn.base_occupancy * hourFactor * weekendMultiplier * rainMultiplier * (1 + pseudoNoise);
      const occupancyRate = Number(Math.min(100, Math.max(5, rawOcc)).toFixed(1));

      // Power draw proportional to active ports
      const activeChargers = Math.max(1, Math.round((occupancyRate / 100) * stn.chargers));
      const powerKw = Number((activeChargers * stn.base_power * (0.85 + (occupancyRate / 100) * 0.20)).toFixed(1));

      rows.push(`"${stn.id}","${stn.name}","${stn.city}",${stn.lat},${stn.lng},"${timestampStr}",${occupancyRate},${powerKw},${temp},${isRaining},"${dayOfWeek}",${hour}`);
    }
  }
}

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const outputPath = path.join(dataDir, 'urban_ev.csv');
fs.writeFileSync(outputPath, rows.join('\n'), 'utf8');
console.log(`Generated ${rows.length - 1} records at ${outputPath}`);
