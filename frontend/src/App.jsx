import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
  return token ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/plots" element={<PrivateRoute><Plots /></PrivateRoute>} />
        <Route path="/plots/new" element={<PrivateRoute><NewPlot /></PrivateRoute>} />
        <Route path="/plots/:id" element={<PrivateRoute><PlotDetail /></PrivateRoute>} />
        <Route path="/advisory/new" element={<PrivateRoute><AdvisoryForm /></PrivateRoute>} />
        <Route path="/advisory/:id" element={<PrivateRoute><AdvisoryReport /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
