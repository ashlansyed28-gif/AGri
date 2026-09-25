import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.post('/auth/login', {
          email: formData.email.trim(),
          password: formData.password,
        });

        if (res.data?.token) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          navigate('/dashboard');
        } else {
          setError('Login succeeded but token was missing.');
        }
      } else {
        const res = await api.post('/auth/register', {
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });

        // If backend returns a token upon registration, log them in directly
        if (res.data?.token) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          navigate('/dashboard');
        } else {
          // Otherwise, switch to login tab with success notice
          setSuccess('Account created successfully! Please log in.');
          setIsLogin(true);
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'An unexpected error occurred. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto mt-6 bg-white p-6 sm:p-8 rounded-xl shadow-md border border-gray-100">
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
          className={`flex-1 pb-3 text-center font-semibold text-lg transition-colors border-b-2 ${
            isLogin ? 'border-green-600 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
          className={`flex-1 pb-3 text-center font-semibold text-lg transition-colors border-b-2 ${
            !isLogin ? 'border-green-600 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Register
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <strong>Error: </strong> {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              className="border border-gray-300 p-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            placeholder="e.g. farmer@example.com"
            className="border border-gray-300 p-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="border border-gray-300 p-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold shadow transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span>{isLogin ? 'Signing In...' : 'Registering...'}</span>
            </>
          ) : (
            <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        {isLogin ? (
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
              className="text-green-700 font-semibold hover:underline"
            >
              Register here
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
              className="text-green-700 font-semibold hover:underline"
            >
              Sign in here
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
