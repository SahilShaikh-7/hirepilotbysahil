
import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/supabase';
import { Navigation, ShieldCheck, Mail, Calendar, ArrowRight, Lock, User } from 'lucide-react';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!fullName) throw new Error('Full name is required');
        await signUpWithEmail(email, password, fullName);
        alert('Signup successful! Please check your email for a confirmation link (if enabled).');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      <nav className="fixed top-0 left-0 right-0 z-[50] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
           <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-extrabold text-xl select-none">
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-xl shadow-md">
                <Navigation size={22} strokeWidth={3} />
              </div>
              <span className="tracking-tight">HirePilot</span>
           </div>
           <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 hidden sm:block">
              Intelligent Recruitment
           </div>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row min-h-screen pt-16">
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-slate-900 p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-indigo-900/50 to-transparent"></div>
          <div className="max-w-md relative z-10">
            <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">
              The next generation of hiring.
            </h1>
            <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
              Manage your entire hiring pipeline from job creation to final interview in one elegant, centralized workspace.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <ShieldCheck className="text-indigo-300" />
                <h3 className="font-semibold">Secure RLS</h3>
                <p className="text-xs text-indigo-200">Production-grade security for your HR data.</p>
              </div>
              <div className="space-y-2">
                <Calendar className="text-indigo-300" />
                <h3 className="font-semibold">Auto-Scheduling</h3>
                <p className="text-xs text-indigo-200">Conflict-free interviews with .ics sync.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center p-8 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-slate-950 dark:to-slate-900">
          <div className="w-full max-w-sm">
            <div className="md:hidden flex items-center justify-center gap-3 mb-8 text-indigo-600 font-extrabold text-3xl">
              <Navigation size={32} strokeWidth={3} />
              <span>HirePilot</span>
            </div>
            
            <div className="bg-white/80 dark:bg-slate-900 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 dark:shadow-none border border-white/50 dark:border-slate-800">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm font-medium">
                {isSignUp ? 'Join the HirePilot team today.' : 'Please sign in to access your dashboard.'}
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl flex items-center gap-3">
                  <ShieldCheck size={16} />
                  {error}
                </div>
              )}
              
              <form onSubmit={handleEmailAuth} className="space-y-5">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" size={18} />
                      <input 
                        type="text"
                        required
                        placeholder="Jane Doe"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" size={18} />
                    <input 
                      type="email"
                      required
                      placeholder="name@company.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" size={18} />
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-700 hover:scale-[1.02] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-200 dark:shadow-none disabled:opacity-50 active:scale-95"
                >
                  {loading ? 'Processing...' : (isSignUp ? 'Launch Account' : 'Secure Sign In')}
                </button>
              </form>

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                  <span className="bg-white/50 dark:bg-slate-900 px-4 text-slate-400 dark:text-slate-500">Fast Access</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-4 px-4 rounded-2xl text-slate-700 dark:text-slate-200 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 group shadow-sm active:scale-95"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="mt-8 text-center">
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                >
                  {isSignUp ? 'Already on the team? Sign In' : "New here? Create your Pilot workspace"}
                </button>
              </div>
            </div>
            
            <p className="mt-8 text-center text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest">
              © 2024 HirePilot Enterprise • v1.5.2
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
