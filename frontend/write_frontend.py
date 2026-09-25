import os

base_dir = 'c:/antigravity google/agriculture-assistant/frontend'

def w(path, content):
    with open(f'{base_dir}/{path}', 'w', encoding='utf-8') as f:
        f.write(content)

w('vite.config.js', '''import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
''')

w('tailwind.config.js', '''/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
''')

w('postcss.config.js', '''export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
''')

w('index.html', '''<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Crop Advisory Assistant</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
''')

w('src/index.css', '''@tailwind base;
@tailwind components;
@tailwind utilities;
''')

w('src/main.jsx', '''import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
''')

w('src/utils/schemas.js', '''import { z } from 'zod';

export const advisoryRequestSchema = z.object({
  plot_id: z.string().uuid(),
  soil_ph: z.number().min(0).max(14),
  n_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  p_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  k_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  moisture_percent: z.number().min(0).max(100),
  weather: z.enum(['DRY', 'RAIN', 'EXTREME_HEAT', 'FROST']),
  growth_stage: z.enum(['SEEDLING', 'VEGETATIVE', 'FLOWERING', 'HARVEST'])
});
''')

w('src/services/api.js', '''import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
''')

w('src/App.jsx', '''import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Plots from './pages/Plots';
import NewPlot from './pages/NewPlot';
import PlotDetail from './pages/PlotDetail';
import AdvisoryForm from './pages/AdvisoryForm';
import AdvisoryReport from './pages/AdvisoryReport';
import Home from './pages/Home';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Layout>{children}</Layout> : <Navigate to="/" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/plots" element={<PrivateRoute><Plots /></PrivateRoute>} />
        <Route path="/plots/new" element={<PrivateRoute><NewPlot /></PrivateRoute>} />
        <Route path="/plots/:id" element={<PrivateRoute><PlotDetail /></PrivateRoute>} />
        <Route path="/advisory/new" element={<PrivateRoute><AdvisoryForm /></PrivateRoute>} />
        <Route path="/advisory/:id" element={<PrivateRoute><AdvisoryReport /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
''')

print("Frontend base config and core setup complete.")
