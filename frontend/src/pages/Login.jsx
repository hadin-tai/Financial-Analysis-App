import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post('/login', form);
      console.log(res.data);
      // Store token and user info in localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('userName', res.data.name);
      navigate('/dashboard'); // Redirect to dashboard after successful login
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      {/* Home Navigation */}
      <div className="absolute top-6 left-6">
        <Link to="/" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
          ← Back to Home
        </Link>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Toggle Navigation */}
        <div className="flex bg-white rounded-full p-1 shadow-sm">
          <div className="flex-1">
            <Link to="/register">
              <div className="bg-white text-black font-bold py-3 px-6 rounded-full text-center border border-black">
                Register
              </div>
            </Link>
          </div>
          <div className="flex-1 ml-4">
            <div className="text-black font-bold py-3 px-6 rounded-full text-center" style={{ backgroundColor: '#FFFF00' }}>
              Login
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-bold py-3 px-6 rounded-[100px] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ backgroundColor: '#16166B' }}
          >
            {isLoading ? 'Signing In...' : 'Sing In'}
          </button>
        </form>

        {/* Additional Info */}
        <p className="text-center text-gray-600 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
