
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  UserCircle, 
  Menu, 
  X,
  Sun,
  Moon,
  Navigation
} from 'lucide-react';
import { signOut } from '../services/supabase';
import { Profile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: Profile | null;
}

const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const userRole = user?.role || 'recruiter';

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', roles: ['admin', 'recruiter', 'interviewer', 'candidate'] },
    { to: '/jobs', icon: <Briefcase size={18} />, label: 'Jobs', roles: ['admin', 'recruiter', 'interviewer', 'candidate'] },
    { to: '/candidates', icon: <Users size={18} />, label: 'Candidates', roles: ['admin', 'recruiter'] },
    { to: '/interviews', icon: <Calendar size={18} />, label: 'Interviews', roles: ['admin', 'recruiter', 'interviewer'] },
    { to: '/managers', icon: <UserCircle size={18} />, label: 'Managers', roles: ['admin', 'recruiter'] },
    { to: '/admin', icon: <Settings size={18} />, label: 'Admin', roles: ['admin'] },
  ].filter(item => !user || item.roles.includes(userRole));

  return (
    <div className="min-h-screen flex flex-col pt-16 relative">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[1000] bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-800 h-16 transition-all duration-300 shadow-sm dark:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center">
              <div 
                className="flex items-center gap-2.5 text-indigo-700 dark:text-indigo-400 font-extrabold text-xl cursor-pointer mr-10 select-none group"
                onClick={() => navigate('/dashboard')}
              >
                <div className="p-2 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                  <Navigation size={22} strokeWidth={3} className="fill-white/10" />
                </div>
                <span className="tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-700 dark:from-white dark:to-indigo-200">HirePilot</span>
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                        isActive 
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' 
                        : 'text-slate-600 hover:bg-white/50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`
                    }
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
               {/* Theme Toggle */}
               <button 
                onClick={toggleTheme}
                className="p-2.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-yellow-400 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800 transition-all"
               >
                 {isDark ? <Sun size={20} /> : <Moon size={20} />}
               </button>

              <div className="hidden md:flex items-center gap-4 pl-4 border-l border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{user?.full_name || 'Loading...'}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">{user?.role || '...'}</p>
                  </div>
                  <img 
                    src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name || 'User'}`} 
                    className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm" 
                    alt="User"
                  />
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 rounded-xl transition-all"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-slate-600 dark:text-slate-300 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 py-4 px-4 space-y-2 shadow-2xl absolute w-full left-0 top-16 z-50">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-bold transition-all ${
                    isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl mb-3">
                <img 
                  src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name || 'User'}`} 
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700" 
                  alt="User"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">{user?.role}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3.5 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-colors"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 mt-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 font-bold text-sm">
            <div className="p-1.5 bg-indigo-600 text-white rounded">
              <Navigation size={14} />
            </div>
            <span>HirePilot ATS</span>
          </div>
          <p className="text-slate-500 dark:text-slate-600 text-xs font-semibold">
            &copy; {new Date().getFullYear()} HirePilot Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
