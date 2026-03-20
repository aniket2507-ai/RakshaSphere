'use strict';
/**
 * sampleZones.js — hardcoded sample risk zones for major Indian cities.
 * Covers all severity levels: Low (10–33), Moderate (34–66), High (67–100).
 * Well-governed / high-literacy states skew Low–Moderate (10–50).
 */

const SAMPLE_ZONES = [
  // ── DELHI ──────────────────────────────────────────────────────────────────
  { zoneId: 'smp-delhi-central',    city: 'Delhi',    name: 'Connaught Place',     lat: 28.6315, lng: 77.2167, score: 72, radius: 3000 },
  { zoneId: 'smp-delhi-chandni',    city: 'Delhi',    name: 'Chandni Chowk',       lat: 28.6506, lng: 77.2303, score: 81, radius: 2500 },
  { zoneId: 'smp-delhi-saket',      city: 'Delhi',    name: 'Saket',               lat: 28.5245, lng: 77.2066, score: 28, radius: 3500 },
  { zoneId: 'smp-delhi-rohini',     city: 'Delhi',    name: 'Rohini',              lat: 28.7495, lng: 77.0680, score: 55, radius: 4000 },
  { zoneId: 'smp-delhi-dwarka',     city: 'Delhi',    name: 'Dwarka',              lat: 28.5921, lng: 77.0460, score: 38, radius: 4500 },
  { zoneId: 'smp-delhi-shahdara',   city: 'Delhi',    name: 'Shahdara',            lat: 28.6730, lng: 77.2940, score: 78, radius: 3000 },
  { zoneId: 'smp-delhi-lajpat',     city: 'Delhi',    name: 'Lajpat Nagar',        lat: 28.5677, lng: 77.2433, score: 44, radius: 2000 },
  { zoneId: 'smp-delhi-gtb',        city: 'Delhi',    name: 'GTB Nagar',           lat: 28.7040, lng: 77.2040, score: 67, radius: 2500 },
  // ── KANPUR ─────────────────────────────────────────────────────────────────
  { zoneId: 'smp-kanpur-central',   city: 'Kanpur',   name: 'Kanpur Central',      lat: 26.4499, lng: 80.3319, score: 74, radius: 3500 },
  { zoneId: 'smp-kanpur-kidwai',    city: 'Kanpur',   name: 'Kidwai Nagar',        lat: 26.4650, lng: 80.3500, score: 58, radius: 2500 },
  { zoneId: 'smp-kanpur-armapur',   city: 'Kanpur',   name: 'Armapur',             lat: 26.5100, lng: 80.2900, score: 31, radius: 3000 },
  { zoneId: 'smp-kanpur-govindnagar', city: 'Kanpur', name: 'Govind Nagar',        lat: 26.4200, lng: 80.3700, score: 62, radius: 2800 },
  { zoneId: 'smp-kanpur-rawatpur',  city: 'Kanpur',   name: 'Rawatpur',            lat: 26.4900, lng: 80.3100, score: 22, radius: 2500 },
  // ── LUCKNOW ────────────────────────────────────────────────────────────────
  { zoneId: 'smp-lucknow-hazratganj', city: 'Lucknow', name: 'Hazratganj',         lat: 26.8467, lng: 80.9462, score: 45, radius: 2500 },
  { zoneId: 'smp-lucknow-chowk',    city: 'Lucknow',  name: 'Chowk',              lat: 26.8700, lng: 80.9200, score: 79, radius: 2000 },
  { zoneId: 'smp-lucknow-gomtinagar', city: 'Lucknow', name: 'Gomti Nagar',        lat: 26.8600, lng: 81.0000, score: 18, radius: 4000 },
  { zoneId: 'smp-lucknow-alambagh', city: 'Lucknow',  name: 'Alambagh',           lat: 26.8100, lng: 80.9100, score: 61, radius: 3000 },
  { zoneId: 'smp-lucknow-aliganj',  city: 'Lucknow',  name: 'Aliganj',            lat: 26.8900, lng: 80.9600, score: 33, radius: 3500 },
  // ── VARANASI ───────────────────────────────────────────────────────────────
  { zoneId: 'smp-varanasi-ghats',   city: 'Varanasi', name: 'Ghats Area',          lat: 25.3100, lng: 83.0100, score: 52, radius: 2000 },
  { zoneId: 'smp-varanasi-lanka',   city: 'Varanasi', name: 'Lanka',               lat: 25.2700, lng: 82.9900, score: 29, radius: 2500 },
  { zoneId: 'smp-varanasi-sigra',   city: 'Varanasi', name: 'Sigra',               lat: 25.3300, lng: 82.9800, score: 68, radius: 2000 },
  { zoneId: 'smp-varanasi-orderly', city: 'Varanasi', name: 'Orderly Bazar',       lat: 25.3200, lng: 82.9700, score: 83, radius: 1800 },
  // ── AGRA ───────────────────────────────────────────────────────────────────
  { zoneId: 'smp-agra-tajganj',     city: 'Agra',     name: 'Taj Ganj',            lat: 27.1751, lng: 78.0421, score: 57, radius: 2500 },
  { zoneId: 'smp-agra-sadar',       city: 'Agra',     name: 'Sadar Bazar',         lat: 27.1900, lng: 78.0100, score: 71, radius: 2000 },
  { zoneId: 'smp-agra-dayalbagh',   city: 'Agra',     name: 'Dayalbagh',           lat: 27.2200, lng: 78.0200, score: 15, radius: 3000 },
  { zoneId: 'smp-agra-bodla',       city: 'Agra',     name: 'Bodla',               lat: 27.1500, lng: 77.9800, score: 42, radius: 3500 },
  // ── MEERUT ─────────────────────────────────────────────────────────────────
  { zoneId: 'smp-meerut-hapur',     city: 'Meerut',   name: 'Hapur Road',          lat: 28.9845, lng: 77.7064, score: 76, radius: 3000 },
  { zoneId: 'smp-meerut-civil',     city: 'Meerut',   name: 'Civil Lines',         lat: 29.0100, lng: 77.7200, score: 24, radius: 2500 },
  { zoneId: 'smp-meerut-lisari',    city: 'Meerut',   name: 'Lisari Gate',         lat: 28.9700, lng: 77.7100, score: 64, radius: 2000 },
  { zoneId: 'smp-meerut-shastri',   city: 'Meerut',   name: 'Shastri Nagar',       lat: 29.0000, lng: 77.6900, score: 39, radius: 2800 },
  // ── MUMBAI ─────────────────────────────────────────────────────────────────
  { zoneId: 'smp-mumbai-dharavi',   city: 'Mumbai',   name: 'Dharavi',             lat: 19.0400, lng: 72.8500, score: 85, radius: 2500 },
  { zoneId: 'smp-mumbai-bandra',    city: 'Mumbai',   name: 'Bandra',              lat: 19.0596, lng: 72.8295, score: 36, radius: 3000 },
  { zoneId: 'smp-mumbai-andheri',   city: 'Mumbai',   name: 'Andheri',             lat: 19.1136, lng: 72.8697, score: 48, radius: 3500 },
  { zoneId: 'smp-mumbai-colaba',    city: 'Mumbai',   name: 'Colaba',              lat: 18.9067, lng: 72.8147, score: 21, radius: 2000 },
  { zoneId: 'smp-mumbai-kurla',     city: 'Mumbai',   name: 'Kurla',               lat: 19.0728, lng: 72.8826, score: 73, radius: 2500 },
  // ── JAIPUR ─────────────────────────────────────────────────────────────────
  { zoneId: 'smp-jaipur-walled',    city: 'Jaipur',   name: 'Walled City',         lat: 26.9239, lng: 75.8267, score: 66, radius: 3000 },
  { zoneId: 'smp-jaipur-mansarovar', city: 'Jaipur',  name: 'Mansarovar',          lat: 26.8500, lng: 75.7700, score: 19, radius: 4000 },
  { zoneId: 'smp-jaipur-malviya',   city: 'Jaipur',   name: 'Malviya Nagar',       lat: 26.8600, lng: 75.8100, score: 41, radius: 3000 },
  { zoneId: 'smp-jaipur-sanganer',  city: 'Jaipur',   name: 'Sanganer',            lat: 26.8100, lng: 75.8000, score: 55, radius: 3500 },
  // ── HYDERABAD ──────────────────────────────────────────────────────────────
  { zoneId: 'smp-hyd-oldcity',      city: 'Hyderabad', name: 'Old City',           lat: 17.3616, lng: 78.4747, score: 77, radius: 3000 },
  { zoneId: 'smp-hyd-hitech',       city: 'Hyderabad', name: 'HITEC City',         lat: 17.4435, lng: 78.3772, score: 12, radius: 4000 },
  { zoneId: 'smp-hyd-secunderabad', city: 'Hyderabad', name: 'Secunderabad',       lat: 17.4399, lng: 78.4983, score: 49, radius: 3500 },
  { zoneId: 'smp-hyd-charminar',    city: 'Hyderabad', name: 'Charminar',          lat: 17.3616, lng: 78.4747, score: 82, radius: 2000 },
  // ── BANGALORE ──────────────────────────────────────────────────────────────
  { zoneId: 'smp-blr-koramangala',  city: 'Bangalore', name: 'Koramangala',        lat: 12.9352, lng: 77.6245, score: 27, radius: 3000 },
  { zoneId: 'smp-blr-whitefield',   city: 'Bangalore', name: 'Whitefield',         lat: 12.9698, lng: 77.7500, score: 16, radius: 4000 },
  { zoneId: 'smp-blr-shivajinagar', city: 'Bangalore', name: 'Shivajinagar',       lat: 12.9850, lng: 77.6010, score: 63, radius: 2500 },
  { zoneId: 'smp-blr-majestic',     city: 'Bangalore', name: 'Majestic',           lat: 12.9767, lng: 77.5713, score: 80, radius: 2000 },
  // ── CHENNAI ────────────────────────────────────────────────────────────────
  { zoneId: 'smp-che-broadway',     city: 'Chennai',  name: 'Broadway',            lat: 13.0900, lng: 80.2850, score: 70, radius: 2500 },
  { zoneId: 'smp-che-adyar',        city: 'Chennai',  name: 'Adyar',               lat: 13.0012, lng: 80.2565, score: 20, radius: 3500 },
  { zoneId: 'smp-che-anna-nagar',   city: 'Chennai',  name: 'Anna Nagar',          lat: 13.0850, lng: 80.2101, score: 35, radius: 3000 },
  { zoneId: 'smp-che-perambur',     city: 'Chennai',  name: 'Perambur',            lat: 13.1200, lng: 80.2500, score: 59, radius: 2500 },
  // ── KOLKATA ────────────────────────────────────────────────────────────────
  { zoneId: 'smp-kol-burrabazar',   city: 'Kolkata',  name: 'Burra Bazar',         lat: 22.5800, lng: 88.3600, score: 75, radius: 2500 },
  { zoneId: 'smp-kol-saltlake',     city: 'Kolkata',  name: 'Salt Lake',           lat: 22.5800, lng: 88.4200, score: 14, radius: 4000 },
  { zoneId: 'smp-kol-howrah',       city: 'Kolkata',  name: 'Howrah',              lat: 22.5958, lng: 88.2636, score: 69, radius: 3000 },
  { zoneId: 'smp-kol-park-street',  city: 'Kolkata',  name: 'Park Street',         lat: 22.5530, lng: 88.3510, score: 32, radius: 2000 },

  // ════════════════════════════════════════════════════════════════════════════
  // KERALA — High literacy, well-governed → mostly Low (10–33)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-tvm-pattom',        city: 'Thiruvananthapuram', name: 'Pattom',           lat: 8.5241,  lng: 76.9366, score: 18, radius: 3000 },
  { zoneId: 'smp-tvm-kowdiar',       city: 'Thiruvananthapuram', name: 'Kowdiar',          lat: 8.5100,  lng: 76.9500, score: 14, radius: 2500 },
  { zoneId: 'smp-tvm-kazhakuttam',   city: 'Thiruvananthapuram', name: 'Kazhakuttam',      lat: 8.5600,  lng: 76.8800, score: 22, radius: 3500 },
  { zoneId: 'smp-tvm-vanchiyoor',    city: 'Thiruvananthapuram', name: 'Vanchiyoor',       lat: 8.4900,  lng: 76.9500, score: 41, radius: 2000 },
  { zoneId: 'smp-kochi-ernakulam',   city: 'Kochi',    name: 'Ernakulam',                  lat: 9.9816,  lng: 76.2999, score: 30, radius: 3000 },
  { zoneId: 'smp-kochi-kakkanad',    city: 'Kochi',    name: 'Kakkanad',                   lat: 10.0159, lng: 76.3419, score: 16, radius: 3500 },
  { zoneId: 'smp-kochi-fort',        city: 'Kochi',    name: 'Fort Kochi',                 lat: 9.9658,  lng: 76.2421, score: 25, radius: 2500 },
  { zoneId: 'smp-kochi-aluva',       city: 'Kochi',    name: 'Aluva',                      lat: 10.1004, lng: 76.3570, score: 38, radius: 3000 },
  { zoneId: 'smp-kozhikode-beach',   city: 'Kozhikode', name: 'Calicut Beach',             lat: 11.2588, lng: 75.7804, score: 29, radius: 2500 },
  { zoneId: 'smp-kozhikode-mavoor',  city: 'Kozhikode', name: 'Mavoor Road',               lat: 11.2500, lng: 75.8000, score: 44, radius: 2000 },
  { zoneId: 'smp-kozhikode-medical', city: 'Kozhikode', name: 'Medical College',           lat: 11.2700, lng: 75.8100, score: 20, radius: 2500 },
  { zoneId: 'smp-thrissur-round',    city: 'Thrissur', name: 'Round South',                lat: 10.5276, lng: 76.2144, score: 23, radius: 2500 },
  { zoneId: 'smp-thrissur-ollur',    city: 'Thrissur', name: 'Ollur',                      lat: 10.5100, lng: 76.1900, score: 17, radius: 3000 },
  { zoneId: 'smp-thrissur-punkunnam', city: 'Thrissur', name: 'Punkunnam',                 lat: 10.5400, lng: 76.2200, score: 31, radius: 2000 },
  // ════════════════════════════════════════════════════════════════════════════
  // HIMACHAL PRADESH — Low crime, scenic → Low (10–30)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-shimla-mall',       city: 'Shimla',   name: 'Mall Road',                  lat: 31.1048, lng: 77.1734, score: 13, radius: 2000 },
  { zoneId: 'smp-shimla-sanjauli',   city: 'Shimla',   name: 'Sanjauli',                   lat: 31.0900, lng: 77.1800, score: 19, radius: 2500 },
  { zoneId: 'smp-shimla-lakkar',     city: 'Shimla',   name: 'Lakkar Bazar',               lat: 31.1000, lng: 77.1700, score: 22, radius: 1800 },
  { zoneId: 'smp-manali-old',        city: 'Manali',   name: 'Old Manali',                 lat: 32.2432, lng: 77.1892, score: 15, radius: 2000 },
  { zoneId: 'smp-manali-mall',       city: 'Manali',   name: 'Mall Road Manali',           lat: 32.2396, lng: 77.1887, score: 11, radius: 1800 },
  { zoneId: 'smp-dharamsala-mcleod', city: 'Dharamsala', name: 'McLeod Ganj',             lat: 32.2427, lng: 76.3234, score: 12, radius: 2000 },
  { zoneId: 'smp-dharamsala-lower',  city: 'Dharamsala', name: 'Lower Dharamsala',        lat: 32.2190, lng: 76.3234, score: 18, radius: 2500 },
  { zoneId: 'smp-kullu-sarwari',     city: 'Kullu',    name: 'Sarwari',                    lat: 31.9592, lng: 77.1089, score: 16, radius: 2000 },
  { zoneId: 'smp-kullu-dhalpur',     city: 'Kullu',    name: 'Dhalpur',                    lat: 31.9600, lng: 77.1100, score: 21, radius: 2000 },
  // ════════════════════════════════════════════════════════════════════════════
  // GOA — Tourist-friendly, low crime → Low–Moderate (12–45)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-panaji-fontainhas', city: 'Panaji',   name: 'Fontainhas',                 lat: 15.4989, lng: 73.8278, score: 17, radius: 2000 },
  { zoneId: 'smp-panaji-miramar',    city: 'Panaji',   name: 'Miramar',                    lat: 15.4800, lng: 73.8100, score: 14, radius: 2500 },
  { zoneId: 'smp-panaji-altinho',    city: 'Panaji',   name: 'Altinho',                    lat: 15.5000, lng: 73.8300, score: 12, radius: 2000 },
  { zoneId: 'smp-margao-monte',      city: 'Margao',   name: 'Monte Hill',                 lat: 15.2832, lng: 73.9862, score: 22, radius: 2500 },
  { zoneId: 'smp-margao-fatorda',    city: 'Margao',   name: 'Fatorda',                    lat: 15.2700, lng: 73.9800, score: 35, radius: 3000 },
  { zoneId: 'smp-vasco-harbour',     city: 'Vasco da Gama', name: 'Harbour Area',          lat: 15.3982, lng: 73.8113, score: 43, radius: 2500 },
  { zoneId: 'smp-vasco-baina',       city: 'Vasco da Gama', name: 'Baina',                 lat: 15.4000, lng: 73.8000, score: 38, radius: 2000 },
  { zoneId: 'smp-mapusa-market',     city: 'Mapusa',   name: 'Mapusa Market',              lat: 15.5957, lng: 73.8091, score: 28, radius: 2000 },
  { zoneId: 'smp-mapusa-angod',      city: 'Mapusa',   name: 'Angod',                      lat: 15.5900, lng: 73.8100, score: 20, radius: 2000 },
  // ════════════════════════════════════════════════════════════════════════════
  // UTTARAKHAND — Pilgrimage/tourism → Low–Moderate (13–52)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-dehradun-rajpur',   city: 'Dehradun', name: 'Rajpur Road',                lat: 30.3165, lng: 78.0322, score: 28, radius: 3000 },
  { zoneId: 'smp-dehradun-paltan',   city: 'Dehradun', name: 'Paltan Bazar',               lat: 30.3200, lng: 78.0400, score: 47, radius: 2500 },
  { zoneId: 'smp-dehradun-prem',     city: 'Dehradun', name: 'Prem Nagar',                 lat: 30.2900, lng: 77.9900, score: 22, radius: 3500 },
  { zoneId: 'smp-dehradun-clement',  city: 'Dehradun', name: 'Clement Town',               lat: 30.2700, lng: 77.9700, score: 19, radius: 3000 },
  { zoneId: 'smp-haridwar-har-ki',   city: 'Haridwar', name: 'Har Ki Pauri',               lat: 29.9457, lng: 78.1642, score: 34, radius: 2000 },
  { zoneId: 'smp-haridwar-jwalapur', city: 'Haridwar', name: 'Jwalapur',                   lat: 29.9200, lng: 78.1500, score: 52, radius: 2500 },
  { zoneId: 'smp-rishikesh-laxman',  city: 'Rishikesh', name: 'Laxman Jhula',             lat: 30.1200, lng: 78.3200, score: 16, radius: 2000 },
  { zoneId: 'smp-rishikesh-tapovan', city: 'Rishikesh', name: 'Tapovan',                  lat: 30.1400, lng: 78.3100, score: 13, radius: 2500 },
  { zoneId: 'smp-nainital-mall',     city: 'Nainital', name: 'Mall Road',                  lat: 29.3803, lng: 79.4636, score: 18, radius: 1800 },
  { zoneId: 'smp-nainital-tallital', city: 'Nainital', name: 'Tallital',                   lat: 29.3700, lng: 79.4600, score: 24, radius: 2000 },
  // ════════════════════════════════════════════════════════════════════════════
  // CHANDIGARH / MOHALI / PANCHKULA → Low (12–22)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-chd-sector17',      city: 'Chandigarh', name: 'Sector 17',               lat: 30.7414, lng: 76.7682, score: 15, radius: 2500 },
  { zoneId: 'smp-chd-sector22',      city: 'Chandigarh', name: 'Sector 22',               lat: 30.7300, lng: 76.7800, score: 20, radius: 2500 },
  { zoneId: 'smp-chd-sector35',      city: 'Chandigarh', name: 'Sector 35',               lat: 30.7200, lng: 76.7600, score: 18, radius: 2500 },
  { zoneId: 'smp-chd-sector43',      city: 'Chandigarh', name: 'Sector 43',               lat: 30.7100, lng: 76.7700, score: 12, radius: 3000 },
  { zoneId: 'smp-panchkula-sec5',    city: 'Panchkula', name: 'Sector 5',                 lat: 30.6942, lng: 76.8606, score: 17, radius: 2500 },
  { zoneId: 'smp-panchkula-sec15',   city: 'Panchkula', name: 'Sector 15',                lat: 30.7000, lng: 76.8700, score: 22, radius: 2500 },
  { zoneId: 'smp-mohali-phase7',     city: 'Mohali',   name: 'Phase 7',                   lat: 30.7046, lng: 76.7179, score: 14, radius: 3000 },
  { zoneId: 'smp-mohali-aerocity',   city: 'Mohali',   name: 'Aerocity',                  lat: 30.6700, lng: 76.7900, score: 19, radius: 3500 },
  // ════════════════════════════════════════════════════════════════════════════
  // PUNJAB CITIES — Amritsar, Ludhiana, Jalandhar, Patiala → Moderate (22–61)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-amritsar-golden',   city: 'Amritsar', name: 'Golden Temple Area',         lat: 31.6200, lng: 74.8765, score: 38, radius: 2500 },
  { zoneId: 'smp-amritsar-ranjit',   city: 'Amritsar', name: 'Ranjit Avenue',              lat: 31.6400, lng: 74.8500, score: 24, radius: 3000 },
  { zoneId: 'smp-amritsar-majitha',  city: 'Amritsar', name: 'Majitha Road',               lat: 31.6500, lng: 74.9000, score: 52, radius: 2500 },
  { zoneId: 'smp-ludhiana-model',    city: 'Ludhiana', name: 'Model Town',                 lat: 30.9100, lng: 75.8400, score: 27, radius: 3000 },
  { zoneId: 'smp-ludhiana-civil',    city: 'Ludhiana', name: 'Civil Lines',                lat: 30.9000, lng: 75.8500, score: 33, radius: 2500 },
  { zoneId: 'smp-ludhiana-giaspura', city: 'Ludhiana', name: 'Giaspura',                   lat: 30.8800, lng: 75.8700, score: 61, radius: 2500 },
  { zoneId: 'smp-jalandhar-model',   city: 'Jalandhar', name: 'Model Town',                lat: 31.3260, lng: 75.5762, score: 29, radius: 3000 },
  { zoneId: 'smp-jalandhar-basti',   city: 'Jalandhar', name: 'Basti Bawa Khel',           lat: 31.3100, lng: 75.5900, score: 58, radius: 2500 },
  { zoneId: 'smp-patiala-rajpura',   city: 'Patiala',  name: 'Rajpura Road',               lat: 30.3398, lng: 76.3869, score: 35, radius: 2500 },
  { zoneId: 'smp-patiala-leela',     city: 'Patiala',  name: 'Leela Bhawan',               lat: 30.3500, lng: 76.4000, score: 22, radius: 2000 },

  // ════════════════════════════════════════════════════════════════════════════
  // ODISHA — Improving governance → Low–Moderate (18–55)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-bbsr-unit4',        city: 'Bhubaneswar', name: 'Unit 4',                 lat: 20.2961, lng: 85.8245, score: 24, radius: 3000 },
  { zoneId: 'smp-bbsr-saheed',       city: 'Bhubaneswar', name: 'Saheed Nagar',           lat: 20.2800, lng: 85.8400, score: 31, radius: 2500 },
  { zoneId: 'smp-bbsr-infocity',     city: 'Bhubaneswar', name: 'Infocity',               lat: 20.3500, lng: 85.8200, score: 18, radius: 3500 },
  { zoneId: 'smp-bbsr-old-town',     city: 'Bhubaneswar', name: 'Old Town',               lat: 20.2400, lng: 85.8300, score: 47, radius: 2500 },
  { zoneId: 'smp-cuttack-buxi',      city: 'Cuttack',  name: 'Buxi Bazar',                lat: 20.4625, lng: 85.8830, score: 55, radius: 2500 },
  { zoneId: 'smp-cuttack-college',   city: 'Cuttack',  name: 'College Square',            lat: 20.4700, lng: 85.8900, score: 38, radius: 2000 },
  { zoneId: 'smp-puri-grand-road',   city: 'Puri',     name: 'Grand Road',                lat: 19.8135, lng: 85.8312, score: 33, radius: 2000 },
  { zoneId: 'smp-puri-sea-beach',    city: 'Puri',     name: 'Sea Beach',                 lat: 19.7980, lng: 85.8245, score: 26, radius: 2500 },
  { zoneId: 'smp-rourkela-civil',    city: 'Rourkela', name: 'Civil Township',            lat: 22.2604, lng: 84.8536, score: 29, radius: 3000 },
  { zoneId: 'smp-rourkela-steel',    city: 'Rourkela', name: 'Steel Township',            lat: 22.2500, lng: 84.8600, score: 22, radius: 3500 },
  // ════════════════════════════════════════════════════════════════════════════
  // ANDHRA PRADESH — Visakhapatnam, Vijayawada, Tirupati, Guntur → Moderate (16–57)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-vizag-mvp',         city: 'Visakhapatnam', name: 'MVP Colony',           lat: 17.7231, lng: 83.3012, score: 22, radius: 3000 },
  { zoneId: 'smp-vizag-gajuwaka',    city: 'Visakhapatnam', name: 'Gajuwaka',             lat: 17.6800, lng: 83.2100, score: 54, radius: 3000 },
  { zoneId: 'smp-vizag-rushikonda',  city: 'Visakhapatnam', name: 'Rushikonda',           lat: 17.7700, lng: 83.3700, score: 16, radius: 3500 },
  { zoneId: 'smp-vizag-steel-plant', city: 'Visakhapatnam', name: 'Steel Plant Area',     lat: 17.6900, lng: 83.2000, score: 38, radius: 3000 },
  { zoneId: 'smp-vijayawada-benz',   city: 'Vijayawada', name: 'Benz Circle',             lat: 16.5062, lng: 80.6480, score: 44, radius: 2500 },
  { zoneId: 'smp-vijayawada-mg',     city: 'Vijayawada', name: 'MG Road',                 lat: 16.5100, lng: 80.6300, score: 57, radius: 2000 },
  { zoneId: 'smp-vijayawada-patamata', city: 'Vijayawada', name: 'Patamata',              lat: 16.5200, lng: 80.6600, score: 28, radius: 3000 },
  { zoneId: 'smp-tirupati-alipiri',  city: 'Tirupati', name: 'Alipiri',                   lat: 13.6288, lng: 79.4192, score: 25, radius: 2500 },
  { zoneId: 'smp-tirupati-renigunta', city: 'Tirupati', name: 'Renigunta',                lat: 13.6500, lng: 79.5100, score: 40, radius: 3000 },
  { zoneId: 'smp-guntur-brodipet',   city: 'Guntur',   name: 'Brodipet',                  lat: 16.3067, lng: 80.4365, score: 36, radius: 2500 },
  { zoneId: 'smp-guntur-arundelpet', city: 'Guntur',   name: 'Arundelpet',                lat: 16.3000, lng: 80.4500, score: 49, radius: 2000 },
  // ════════════════════════════════════════════════════════════════════════════
  // TELANGANA (non-Hyderabad) — Warangal, Karimnagar, Nizamabad → Moderate (31–55)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-warangal-hanamkonda', city: 'Warangal', name: 'Hanamkonda',              lat: 18.0000, lng: 79.5667, score: 42, radius: 3000 },
  { zoneId: 'smp-warangal-kazipet',  city: 'Warangal', name: 'Kazipet',                   lat: 17.9700, lng: 79.5200, score: 55, radius: 2500 },
  { zoneId: 'smp-warangal-subedari', city: 'Warangal', name: 'Subedari',                  lat: 17.9800, lng: 79.5900, score: 33, radius: 2500 },
  { zoneId: 'smp-karimnagar-mango',  city: 'Karimnagar', name: 'Mango Market',            lat: 18.4386, lng: 79.1288, score: 47, radius: 2500 },
  { zoneId: 'smp-karimnagar-godavari', city: 'Karimnagar', name: 'Godavari Colony',       lat: 18.4500, lng: 79.1400, score: 31, radius: 2500 },
  { zoneId: 'smp-nizamabad-dichpally', city: 'Nizamabad', name: 'Dichpally Road',         lat: 18.6725, lng: 78.0941, score: 38, radius: 3000 },
  { zoneId: 'smp-nizamabad-bodhan',  city: 'Nizamabad', name: 'Bodhan',                   lat: 18.6600, lng: 77.9000, score: 44, radius: 2500 },
  // ════════════════════════════════════════════════════════════════════════════
  // ASSAM — Guwahati, Dibrugarh, Silchar → Moderate (32–55)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-guwahati-pan-bazar', city: 'Guwahati', name: 'Pan Bazar',                lat: 26.1445, lng: 91.7362, score: 48, radius: 2500 },
  { zoneId: 'smp-guwahati-dispur',   city: 'Guwahati', name: 'Dispur',                    lat: 26.1400, lng: 91.7800, score: 32, radius: 3000 },
  { zoneId: 'smp-guwahati-jalukbari', city: 'Guwahati', name: 'Jalukbari',                lat: 26.1600, lng: 91.6900, score: 55, radius: 3000 },
  { zoneId: 'smp-guwahati-sixmile',  city: 'Guwahati', name: 'Six Mile',                  lat: 26.1300, lng: 91.8200, score: 39, radius: 2500 },
  { zoneId: 'smp-dibrugarh-chowkidinghee', city: 'Dibrugarh', name: 'Chowkidinghee',     lat: 27.4728, lng: 94.9120, score: 43, radius: 2500 },
  { zoneId: 'smp-dibrugarh-graham',  city: 'Dibrugarh', name: 'Graham Bazar',             lat: 27.4800, lng: 94.9200, score: 36, radius: 2000 },
  { zoneId: 'smp-silchar-ambikapur', city: 'Silchar',  name: 'Ambikapur',                 lat: 24.8333, lng: 92.7789, score: 51, radius: 2500 },
  { zoneId: 'smp-silchar-rangirkhari', city: 'Silchar', name: 'Rangirkhari',              lat: 24.8200, lng: 92.7900, score: 40, radius: 2500 },
  // ════════════════════════════════════════════════════════════════════════════
  // GUJARAT — Gandhinagar, Vadodara, Surat, Rajkot → Low–Moderate (12–52)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-gandhinagar-sec1',  city: 'Gandhinagar', name: 'Sector 1',               lat: 23.2156, lng: 72.6369, score: 15, radius: 3000 },
  { zoneId: 'smp-gandhinagar-sec21', city: 'Gandhinagar', name: 'Sector 21',              lat: 23.2200, lng: 72.6500, score: 12, radius: 3000 },
  { zoneId: 'smp-gandhinagar-infocity', city: 'Gandhinagar', name: 'Infocity',            lat: 23.1900, lng: 72.6300, score: 18, radius: 3500 },
  { zoneId: 'smp-vadodara-alkapuri', city: 'Vadodara', name: 'Alkapuri',                  lat: 22.3119, lng: 73.1723, score: 19, radius: 3000 },
  { zoneId: 'smp-vadodara-fatehgunj', city: 'Vadodara', name: 'Fatehgunj',                lat: 22.3300, lng: 73.1900, score: 33, radius: 2500 },
  { zoneId: 'smp-vadodara-manjalpur', city: 'Vadodara', name: 'Manjalpur',                lat: 22.2800, lng: 73.1800, score: 27, radius: 3000 },
  { zoneId: 'smp-surat-adajan',      city: 'Surat',    name: 'Adajan',                    lat: 21.2100, lng: 72.8000, score: 24, radius: 3500 },
  { zoneId: 'smp-surat-vesu',        city: 'Surat',    name: 'Vesu',                      lat: 21.1600, lng: 72.7800, score: 18, radius: 3000 },
  { zoneId: 'smp-surat-katargam',    city: 'Surat',    name: 'Katargam',                  lat: 21.2300, lng: 72.8400, score: 52, radius: 2500 },
  { zoneId: 'smp-rajkot-kalawad',    city: 'Rajkot',   name: 'Kalawad Road',              lat: 22.3100, lng: 70.7800, score: 28, radius: 3000 },
  { zoneId: 'smp-rajkot-university', city: 'Rajkot',   name: 'University Road',           lat: 22.3000, lng: 70.7900, score: 22, radius: 3000 },
  { zoneId: 'smp-rajkot-gondal',     city: 'Rajkot',   name: 'Gondal Road',               lat: 22.2800, lng: 70.7700, score: 40, radius: 2500 },

  // ════════════════════════════════════════════════════════════════════════════
  // NORTHEAST STATES — Sikkim, Meghalaya, Tripura, Manipur, Mizoram, Nagaland
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-gangtok-mg-marg',   city: 'Gangtok',  name: 'MG Marg',                   lat: 27.3389, lng: 88.6065, score: 11, radius: 2000 },
  { zoneId: 'smp-gangtok-deorali',   city: 'Gangtok',  name: 'Deorali',                   lat: 27.3200, lng: 88.6100, score: 15, radius: 2000 },
  { zoneId: 'smp-gangtok-tadong',    city: 'Gangtok',  name: 'Tadong',                    lat: 27.3300, lng: 88.6200, score: 19, radius: 2000 },
  { zoneId: 'smp-shillong-police-bazar', city: 'Shillong', name: 'Police Bazar',          lat: 25.5788, lng: 91.8933, score: 28, radius: 2000 },
  { zoneId: 'smp-shillong-laitumkhrah', city: 'Shillong', name: 'Laitumkhrah',            lat: 25.5700, lng: 91.9000, score: 22, radius: 2000 },
  { zoneId: 'smp-shillong-mawlai',   city: 'Shillong', name: 'Mawlai',                    lat: 25.5900, lng: 91.9100, score: 30, radius: 2500 },
  { zoneId: 'smp-agartala-krishna',  city: 'Agartala', name: 'Krishna Nagar',             lat: 23.8315, lng: 91.2868, score: 24, radius: 2500 },
  { zoneId: 'smp-agartala-battala',  city: 'Agartala', name: 'Battala',                   lat: 23.8400, lng: 91.2900, score: 33, radius: 2000 },
  { zoneId: 'smp-agartala-airport',  city: 'Agartala', name: 'Airport Road',              lat: 23.8800, lng: 91.2400, score: 18, radius: 2500 },
  { zoneId: 'smp-imphal-paona',      city: 'Imphal',   name: 'Paona Bazar',               lat: 24.8170, lng: 93.9368, score: 45, radius: 2000 },
  { zoneId: 'smp-imphal-singjamei',  city: 'Imphal',   name: 'Singjamei',                 lat: 24.8300, lng: 93.9200, score: 38, radius: 2500 },
  { zoneId: 'smp-imphal-lamphel',    city: 'Imphal',   name: 'Lamphel',                   lat: 24.8000, lng: 93.9100, score: 29, radius: 2500 },
  { zoneId: 'smp-aizawl-zarkawt',    city: 'Aizawl',   name: 'Zarkawt',                   lat: 23.7271, lng: 92.7176, score: 13, radius: 2000 },
  { zoneId: 'smp-aizawl-bawngkawn',  city: 'Aizawl',   name: 'Bawngkawn',                 lat: 23.7200, lng: 92.7100, score: 10, radius: 2000 },
  { zoneId: 'smp-aizawl-chaltlang',  city: 'Aizawl',   name: 'Chaltlang',                 lat: 23.7400, lng: 92.7300, score: 16, radius: 2000 },
  { zoneId: 'smp-kohima-high-school', city: 'Kohima',  name: 'High School Junction',      lat: 25.6751, lng: 94.1086, score: 17, radius: 2000 },
  { zoneId: 'smp-kohima-naga-bazaar', city: 'Kohima',  name: 'Naga Bazaar',               lat: 25.6700, lng: 94.1100, score: 22, radius: 2000 },
  // ════════════════════════════════════════════════════════════════════════════
  // CHHATTISGARH — Raipur, Bilaspur → Moderate (29–63)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-raipur-shankar',    city: 'Raipur',   name: 'Shankar Nagar',             lat: 21.2514, lng: 81.6296, score: 38, radius: 3000 },
  { zoneId: 'smp-raipur-telibandha', city: 'Raipur',   name: 'Telibandha',                lat: 21.2400, lng: 81.6400, score: 44, radius: 2500 },
  { zoneId: 'smp-raipur-pandri',     city: 'Raipur',   name: 'Pandri',                    lat: 21.2600, lng: 81.6500, score: 57, radius: 2500 },
  { zoneId: 'smp-raipur-civil-lines', city: 'Raipur',  name: 'Civil Lines',               lat: 21.2700, lng: 81.6200, score: 29, radius: 3000 },
  { zoneId: 'smp-bilaspur-vyapar',   city: 'Bilaspur', name: 'Vyapar Vihar',              lat: 22.0797, lng: 82.1409, score: 35, radius: 2500 },
  { zoneId: 'smp-bilaspur-torwa',    city: 'Bilaspur', name: 'Torwa',                     lat: 22.0900, lng: 82.1500, score: 52, radius: 2500 },
  { zoneId: 'smp-bilaspur-sadar',    city: 'Bilaspur', name: 'Sadar Bazar',               lat: 22.0700, lng: 82.1300, score: 63, radius: 2000 },
  // ════════════════════════════════════════════════════════════════════════════
  // JHARKHAND — Ranchi, Jamshedpur, Dhanbad → Moderate–High (24–75)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-ranchi-main-road',  city: 'Ranchi',   name: 'Main Road',                 lat: 23.3441, lng: 85.3096, score: 48, radius: 2500 },
  { zoneId: 'smp-ranchi-harmu',      city: 'Ranchi',   name: 'Harmu',                     lat: 23.3600, lng: 85.3200, score: 35, radius: 3000 },
  { zoneId: 'smp-ranchi-kanke',      city: 'Ranchi',   name: 'Kanke Road',                lat: 23.3800, lng: 85.3000, score: 27, radius: 3500 },
  { zoneId: 'smp-ranchi-lalpur',     city: 'Ranchi',   name: 'Lalpur',                    lat: 23.3300, lng: 85.3300, score: 62, radius: 2500 },
  { zoneId: 'smp-jamshedpur-bistupur', city: 'Jamshedpur', name: 'Bistupur',              lat: 22.8046, lng: 86.2029, score: 33, radius: 2500 },
  { zoneId: 'smp-jamshedpur-sakchi', city: 'Jamshedpur', name: 'Sakchi',                  lat: 22.7900, lng: 86.1900, score: 55, radius: 2500 },
  { zoneId: 'smp-jamshedpur-telco',  city: 'Jamshedpur', name: 'Telco Colony',            lat: 22.8200, lng: 86.2200, score: 24, radius: 3000 },
  { zoneId: 'smp-dhanbad-hirapur',   city: 'Dhanbad',  name: 'Hirapur',                   lat: 23.7957, lng: 86.4304, score: 68, radius: 2500 },
  { zoneId: 'smp-dhanbad-jharia',    city: 'Dhanbad',  name: 'Jharia',                    lat: 23.7600, lng: 86.4100, score: 75, radius: 2500 },
  { zoneId: 'smp-dhanbad-bank-more', city: 'Dhanbad',  name: 'Bank More',                 lat: 23.8000, lng: 86.4500, score: 52, radius: 2000 },
  // ════════════════════════════════════════════════════════════════════════════
  // BIHAR — Patna, Gaya, Muzaffarpur → Moderate–High (34–72)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-patna-boring-road', city: 'Patna',    name: 'Boring Road',               lat: 25.6093, lng: 85.1376, score: 42, radius: 3000 },
  { zoneId: 'smp-patna-kankarbagh',  city: 'Patna',    name: 'Kankarbagh',                lat: 25.5900, lng: 85.1600, score: 65, radius: 2500 },
  { zoneId: 'smp-patna-rajendra',    city: 'Patna',    name: 'Rajendra Nagar',            lat: 25.6000, lng: 85.1200, score: 38, radius: 3000 },
  { zoneId: 'smp-patna-phulwari',    city: 'Patna',    name: 'Phulwari Sharif',           lat: 25.5600, lng: 85.1000, score: 72, radius: 3000 },
  { zoneId: 'smp-gaya-bodh-gaya',    city: 'Gaya',     name: 'Bodh Gaya',                 lat: 24.6961, lng: 84.9914, score: 34, radius: 2500 },
  { zoneId: 'smp-gaya-rampur',       city: 'Gaya',     name: 'Rampur',                    lat: 24.7900, lng: 85.0100, score: 58, radius: 2500 },
  { zoneId: 'smp-muzaffarpur-mithanpura', city: 'Muzaffarpur', name: 'Mithanpura',        lat: 26.1209, lng: 85.3647, score: 67, radius: 2500 },
  { zoneId: 'smp-muzaffarpur-brahmpura', city: 'Muzaffarpur', name: 'Brahmpura',          lat: 26.1300, lng: 85.3800, score: 54, radius: 2500 },
  // ════════════════════════════════════════════════════════════════════════════
  // MADHYA PRADESH — Bhopal, Indore, Gwalior, Jabalpur → Moderate (19–62)
  // ════════════════════════════════════════════════════════════════════════════
  { zoneId: 'smp-bhopal-mp-nagar',   city: 'Bhopal',   name: 'MP Nagar',                  lat: 23.2332, lng: 77.4272, score: 32, radius: 3000 },
  { zoneId: 'smp-bhopal-kolar',      city: 'Bhopal',   name: 'Kolar Road',                lat: 23.1900, lng: 77.4500, score: 28, radius: 3500 },
  { zoneId: 'smp-bhopal-old-bhopal', city: 'Bhopal',   name: 'Old Bhopal',                lat: 23.2600, lng: 77.4000, score: 61, radius: 2500 },
  { zoneId: 'smp-bhopal-arera',      city: 'Bhopal',   name: 'Arera Colony',              lat: 23.2100, lng: 77.4300, score: 22, radius: 3000 },
  { zoneId: 'smp-indore-vijay-nagar', city: 'Indore',  name: 'Vijay Nagar',               lat: 22.7533, lng: 75.8937, score: 24, radius: 3000 },
  { zoneId: 'smp-indore-palasia',    city: 'Indore',   name: 'Palasia',                   lat: 22.7200, lng: 75.8800, score: 38, radius: 2500 },
  { zoneId: 'smp-indore-rajwada',    city: 'Indore',   name: 'Rajwada',                   lat: 22.7196, lng: 75.8577, score: 55, radius: 2000 },
  { zoneId: 'smp-indore-lasudia',    city: 'Indore',   name: 'Lasudia',                   lat: 22.7600, lng: 75.9200, score: 19, radius: 3500 },
  { zoneId: 'smp-gwalior-lashkar',   city: 'Gwalior',  name: 'Lashkar',                   lat: 26.2183, lng: 78.1828, score: 58, radius: 2500 },
  { zoneId: 'smp-gwalior-morar',     city: 'Gwalior',  name: 'Morar',                     lat: 26.2400, lng: 78.2100, score: 44, radius: 2500 },
  { zoneId: 'smp-gwalior-thatipur',  city: 'Gwalior',  name: 'Thatipur',                  lat: 26.2000, lng: 78.1600, score: 31, radius: 3000 },
  { zoneId: 'smp-jabalpur-napier',   city: 'Jabalpur', name: 'Napier Town',               lat: 23.1815, lng: 79.9864, score: 47, radius: 2500 },
  { zoneId: 'smp-jabalpur-adhartal', city: 'Jabalpur', name: 'Adhartal',                  lat: 23.2000, lng: 79.9700, score: 33, radius: 3000 },
  { zoneId: 'smp-jabalpur-gorakhpur', city: 'Jabalpur', name: 'Gorakhpur',                lat: 23.1700, lng: 79.9500, score: 62, radius: 2500 },
];

function scoreToClassification(score) {
  if (score <= 33) return 'Low';
  if (score <= 66) return 'Moderate';
  return 'High';
}

function scoreToColor(score) {
  if (score <= 33) return '#4CAF50';
  if (score <= 66) return '#FFC107';
  return '#F44336';
}

function getSampleZones() {
  return SAMPLE_ZONES.map(z => ({
    ...z,
    classification: scoreToClassification(z.score),
    color: scoreToColor(z.score),
    source: 'sample',
  }));
}

module.exports = { getSampleZones };
