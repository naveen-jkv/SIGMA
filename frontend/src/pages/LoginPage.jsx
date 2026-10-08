import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Shield, User, Lock, AlertCircle, ArrowRight, Activity, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('AUTHORITY'); // 'HEALTH_WORKER' or 'AUTHORITY'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email address and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login({ email, password, role });
      if (res?.success) {
        showToast(`Welcome back, ${res.user?.name || 'Officer'}!`, 'success');
        if (role === 'HEALTH_WORKER') {
          navigate('/worker-dashboard');
        } else {
          navigate('/authority-dashboard');
        }
      } else {
        setError(res?.error || 'Invalid authentication credentials');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Authentication server unreachable. Try Demo Mode below.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole) => {
    setLoading(true);
    setError('');
    try {
      const res = await demoLogin(demoRole);
      showToast(`Logged in as demo ${demoRole === 'AUTHORITY' ? 'Health Authority' : 'Health Worker'}!`, 'success');
      if (demoRole === 'HEALTH_WORKER') {
        navigate('/worker-dashboard');
      } else {
        navigate('/authority-dashboard');
      }
    } catch (err) {
      setError('Failed to initiate demo session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 select-none font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden relative z-10">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 p-8 text-center text-white relative border-b border-slate-800">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-brand-500 to-cyan-300 flex items-center justify-center shadow-glow-teal mb-4 text-white">
            <Droplets className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">AQUASENSE</h1>
          <p className="text-cyan-300/90 text-xs font-medium tracking-wide mt-1">
            AI-Powered Water-Borne Disease Outbreak Early Warning System
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>National Surveillance Portal</span>
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Surveillance Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('HEALTH_WORKER')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    role === 'HEALTH_WORKER'
                      ? 'bg-cyan-50 border-brand-500 text-brand-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Health Worker
                </button>
                <button
                  type="button"
                  onClick={() => setRole('AUTHORITY')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    role === 'AUTHORITY'
                      ? 'bg-cyan-50 border-brand-500 text-brand-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Health Authority
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'AUTHORITY' ? 'officer@aquasense.org' : 'worker@aquasense.org'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Secure Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Surveillance Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Hackathon Quick Demo Access Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-center mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-white px-2">
                ⚡ Instant Hackathon Demo Access
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('AUTHORITY')}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Authority Demo</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('HEALTH_WORKER')}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-brand-600" />
                <span>Worker Demo</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2.5 leading-tight">
              One-click entry for judges with pre-loaded epidemiological telemetry.
            </p>
          </div>
        </div>

        {/* Medical Non-diagnostic Disclaimer Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500 font-medium">
          AQUASENSE is a public health early-warning support tool. It does not provide medical diagnoses.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
