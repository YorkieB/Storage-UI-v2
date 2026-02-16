import { useState } from 'react';
import { X, LogIn } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLogin, darkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(email, password);
      // Success - modal will close automatically
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const bgPanel = darkMode ? 'bg-gray-800' : 'bg-white';
  const textMain = darkMode ? 'text-white' : 'text-gray-900';
  const textSec = darkMode ? 'text-gray-400' : 'text-gray-600';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`rounded-2xl shadow-2xl w-full max-w-md p-8 ${bgPanel}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <LogIn className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className={`text-2xl font-bold ${textMain}`}>Welcome Back</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${textSec}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${textMain}`}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border ${inputBg} ${textMain} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${textMain}`}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border ${inputBg} ${textMain} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors shadow-lg"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Help Text */}
        <p className={`text-xs text-center mt-6 ${textSec}`}>
          This is a private instance. Contact admin for account access.
        </p>
      </div>
    </div>
  );
}
