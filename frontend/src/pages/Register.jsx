import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
      const res = await axios.post('/register', form);
      console.log(res.data);
      navigate('/login'); // Redirect after successful registration
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
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
            <div className="text-black font-bold py-3 px-6 rounded-full text-center" style={{ backgroundColor: '#FFFF00' }}>
              Register
            </div>
          </div>
          <div className="flex-1 ml-4">
            <Link to="/login">
              <div className="bg-white text-black font-bold py-3 px-6 rounded-full text-center border border-black">
                Login
              </div>
            </Link>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          
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
            {isLoading ? 'Signing Up...' : 'Sing Up'}
          </button>
        </form>

        {/* Additional Info */}
        <p className="text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
