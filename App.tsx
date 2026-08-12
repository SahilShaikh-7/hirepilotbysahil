
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabase';
import { Profile } from './types';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Interviews from './pages/Interviews';
import ScheduleInterview from './pages/ScheduleInterview';
import Candidates from './pages/Candidates';
import CandidateProfile from './pages/CandidateProfile';
import Jobs from './pages/Jobs';
import JobForm from './pages/JobForm';
import JobDetails from './pages/JobDetails';
import Admin from './pages/Admin';
import Managers from './pages/Managers';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (user: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        // Self-healing: Ensure admin email always has admin role
        if (user.email === 'sahil68shaikh68@gmail.com' && data.role !== 'admin') {
           await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
           data.role = 'admin';
        }
        setProfile(data);
      } else {
        // Profile missing, attempt to create it
        console.warn("Profile record missing for authenticated user. Attempting manual sync...");
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'ATS User',
            role: user.email === 'sahil68shaikh68@gmail.com' ? 'admin' : 'recruiter'
          }])
          .select()
          .single();

        if (createError) {
          console.error("Self-healing failed:", createError);
          // Fallback profile object to ensure UI renders
          setProfile({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'User',
            role: 'recruiter', // Default to recruiter to show UI
            avatar_url: '',
            created_at: new Date().toISOString()
          });
        } else {
          setProfile(newProfile);
        }
      }
    } catch (err) {
      console.error("Unexpected error in fetchProfile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Synchronizing Profile...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/" 
          element={session ? <Navigate to="/dashboard" /> : <Login />} 
        />
        
        <Route
          path="/*"
          element={
            session ? (
              <Layout user={profile}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/interviews" element={<Interviews />} />
                  <Route path="/interviews/new" element={<ScheduleInterview />} />
                  <Route path="/interviews/edit/:id" element={<ScheduleInterview />} />
                  <Route path="/candidates" element={<Candidates />} />
                  <Route path="/candidates/:id" element={<CandidateProfile />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/jobs/new" element={<JobForm />} />
                  <Route path="/jobs/edit/:id" element={<JobForm />} />
                  <Route path="/jobs/:id" element={<JobDetails />} />
                  <Route path="/managers" element={<Managers />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<Navigate to="/dashboard" /> } />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default App;
