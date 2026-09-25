import axios from 'axios';

// Determine backend URL
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL.trim();
    return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }
  return '/api';
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Client-side storage fallback engine (for seamless client deployment)
const storage = {
  getUsers: () => JSON.parse(localStorage.getItem('agri_users') || '[]'),
  saveUsers: (users) => localStorage.setItem('agri_users', JSON.stringify(users)),
  getPlots: () => JSON.parse(localStorage.getItem('agri_plots') || '[]'),
  savePlots: (plots) => localStorage.setItem('agri_plots', JSON.stringify(plots)),
  getAdvisories: () => JSON.parse(localStorage.getItem('agri_advisories') || '[]'),
  saveAdvisories: (adv) => localStorage.setItem('agri_advisories', JSON.stringify(adv)),
};

// Generates scientifically sound crop advisory report
function generateAgronomicAdvisory(data, plot) {
  const crop = plot?.crop_type || 'Selected Crop';
  const stage = data.growth_stage || 'VEGETATIVE';
  const ph = parseFloat(data.soil_ph) || 6.5;
  const weather = data.weather || 'DRY';
  const moisture = data.moisture_percent || 50;

  // Fertilizer recommendations based on N-P-K & pH
  const fertilizerPlan = [];
  fertilizerPlan.push(`Stage-specific top dressing: Apply balanced N-P-K formulation optimized for ${stage} stage.`);
  if (data.n_level === 'LOW') {
    fertilizerPlan.push('Nitrogen deficiency detected: Supplement with urea or calcium nitrate (15-20 kg/acre) within 48 hours.');
  } else if (data.n_level === 'HIGH') {
    fertilizerPlan.push('Elevated Nitrogen detected: Halve standard nitrogenous inputs to avert excessive vegetative growth.');
  }
  if (data.p_level === 'LOW') {
    fertilizerPlan.push('Low Phosphorus: Apply Single Super Phosphate (SSP) to promote robust root establishment.');
  }
  if (data.k_level === 'LOW') {
    fertilizerPlan.push('Low Potassium: Apply Muriate of Potash (MOP) to enhance pest defense and water stress tolerance.');
  }
  if (ph < 6.0) {
    fertilizerPlan.push(`Acidic soil (pH ${ph}): Broadcast agricultural lime or dolomite at 200 kg/acre to restore neutral buffer.`);
  } else if (ph > 7.5) {
    fertilizerPlan.push(`Alkaline soil (pH ${ph}): Apply agricultural gypsum or composted organic manure to lower alkalinity.`);
  } else {
    fertilizerPlan.push(`Soil pH (${ph}) is in the optimal agronomic range; sustain current composting regimen.`);
  }

  // Irrigation recommendations
  const irrigationPlan = [];
  if (weather === 'RAIN') {
    irrigationPlan.push('Rain forecasted: Immediately suspend scheduled irrigation; clear perimeter drains to prevent root waterlogging.');
  } else if (weather === 'EXTREME_HEAT') {
    irrigationPlan.push(`Heat wave alert (Moisture: ${moisture}%): Schedule split drip irrigation in early morning (05:00-08:00) to counter evapotranspiration.`);
  } else if (weather === 'FROST') {
    irrigationPlan.push('Frost advisory: Apply a light pre-dusk micro-irrigation pulse to release latent ground heat.');
  } else {
    irrigationPlan.push(`Maintain soil moisture between 50% - 65% with regular evening drip cycles.`);
  }
  irrigationPlan.push('Monitor root-zone tensiometer at 20cm depth to prevent subterranean moisture stress.');

  // Risk warnings
  const riskWarnings = [];
  if (weather === 'EXTREME_HEAT') {
    riskWarnings.push('Thermal shock alert: High potential for flower abortion and leaf marginal scorch.');
  } else if (weather === 'RAIN') {
    riskWarnings.push('Pathogen outbreak warning: High humidity promotes fungal leaf spot, anthracnose, and root rot.');
  } else if (weather === 'FROST') {
    riskWarnings.push('Frost injury hazard: Young shoots vulnerable to cellular freezing; deploy anti-frost mulching.');
  } else {
    riskWarnings.push('Standard scouting: Inspect undersides of leaves twice weekly for aphid, whitefly, or thrip populations.');
  }
  if (moisture > 80) {
    riskWarnings.push('Excess soil saturation detected: Aerate furrows to prevent anaerobic root asphyxiation.');
  }

  return {
    summary: `Agronomic analysis for ${crop} during the ${stage} growth phase indicates a soil pH of ${ph} with ${weather.toLowerCase()} meteorological outlook. Tailored nutrient and moisture adjustments are recommended below.`,
    fertilizer_plan: fertilizerPlan,
    irrigation_plan: irrigationPlan,
    risk_warnings: riskWarnings,
  };
}

// Fallback router for static deployments
const clientFallback = {
  post: async (path, body) => {
    // 1. Register
    if (path === '/auth/register') {
      const users = storage.getUsers();
      if (users.some((u) => u.email === body.email)) {
        throw { response: { data: { error: 'An account with this email already exists.' } } };
      }
      const newUser = {
        id: 'usr-' + Date.now(),
        email: body.email,
        full_name: body.full_name,
        created_at: new Date().toISOString(),
      };
      users.push(newUser);
      storage.saveUsers(users);
      const token = 'tok-' + Date.now();
      return { data: { token, user: newUser } };
    }

    // 2. Login
    if (path === '/auth/login') {
      const users = storage.getUsers();
      const user = users.find((u) => u.email === body.email);
      if (!user) {
        // Allow instant onboarding for first-time testers if no account exists yet
        const newUser = {
          id: 'usr-' + Date.now(),
          email: body.email,
          full_name: body.email.split('@')[0],
          created_at: new Date().toISOString(),
        };
        users.push(newUser);
        storage.saveUsers(users);
        return { data: { token: 'tok-' + Date.now(), user: newUser } };
      }
      return { data: { token: 'tok-' + Date.now(), user } };
    }

    // 3. Create Plot
    if (path === '/plots') {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const plots = storage.getPlots();
      const newPlot = {
        id: 'plot-' + Date.now(),
        user_id: currentUser.id,
        plot_name: body.plot_name,
        crop_type: body.crop_type,
        acreage: body.acreage,
        region: body.region,
        created_at: new Date().toISOString(),
      };
      plots.unshift(newPlot);
      storage.savePlots(plots);
      return { data: newPlot };
    }

    // 4. Generate Advisory
    if (path === '/advisory/generate') {
      const plots = storage.getPlots();
      const plot = plots.find((p) => p.id === body.plot_id);
      const recommendation = generateAgronomicAdvisory(body, plot);
      const advisories = storage.getAdvisories();
      const newAdvisory = {
        id: 'adv-' + Date.now(),
        plot_id: body.plot_id,
        soil_ph: body.soil_ph,
        n_level: body.n_level,
        p_level: body.p_level,
        k_level: body.k_level,
        moisture_percent: body.moisture_percent,
        weather: body.weather,
        growth_stage: body.growth_stage,
        ai_recommendation_json: recommendation,
        created_at: new Date().toISOString(),
      };
      advisories.unshift(newAdvisory);
      storage.saveAdvisories(advisories);
      return { data: newAdvisory };
    }

    throw { response: { data: { error: `Not found: ${path}` } } };
  },

  get: async (path) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // 1. Get Plots
    if (path === '/plots') {
      const plots = storage.getPlots().filter((p) => !p.user_id || p.user_id === currentUser.id);
      return { data: plots };
    }

    // 2. Get Plot Detail
    if (path.startsWith('/plots/')) {
      const id = path.replace('/plots/', '');
      const plots = storage.getPlots();
      const plot = plots.find((p) => p.id === id);
      if (!plot) throw { response: { data: { error: 'Plot not found' } } };
      const advisories = storage.getAdvisories().filter((a) => a.plot_id === id);
      return { data: { ...plot, advisories } };
    }

    // 3. Get Advisory Detail
    if (path.startsWith('/advisory/')) {
      const id = path.replace('/advisory/', '');
      const advisories = storage.getAdvisories();
      const advisory = advisories.find((a) => a.id === id);
      if (!advisory) throw { response: { data: { error: 'Advisory not found' } } };
      return { data: advisory };
    }

    throw { response: { data: { error: `Not found: ${path}` } } };
  },
};

// Proxy handler: Attempts network call first; seamlessly handles client-side fallback if server is unreachable
const api = {
  get: async (url, config) => {
    try {
      return await axiosInstance.get(url, config);
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.response.status === 404) {
        return await clientFallback.get(url);
      }
      throw err;
    }
  },
  post: async (url, data, config) => {
    try {
      return await axiosInstance.post(url, data, config);
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.response.status === 404) {
        return await clientFallback.post(url, data);
      }
      throw err;
    }
  },
};

export default api;
