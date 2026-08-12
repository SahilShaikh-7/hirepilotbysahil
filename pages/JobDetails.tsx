
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Job } from '../types';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Users, 
  Building2, 
  Clock, 
  User,
  Power,
  ChevronRight
} from 'lucide-react';

const JobDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [candidateCount, setCandidateCount] = useState(0);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select(`
        *,
        profiles:hiring_manager_id (full_name, email, avatar_url)
      `)
      .eq('id', id)
      .single();
    
    if (data) setJob(data);

    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', id);
    setCandidateCount(count || 0);
    
    setLoading(false);
  };

  const toggleStatus = async () => {
    const newStatus = job.status === 'open' ? 'closed' : 'open';
    const { error } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (error) alert('Error updating status');
    else fetchJobDetails();
  };

  if (loading) return <div className="p-20 text-center text-slate-400">Loading details...</div>;
  if (!job) return <div className="p-20 text-center text-slate-400">Job not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/jobs')} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-semibold">
          <ArrowLeft size={18} />
          Back to Jobs
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              job.status === 'open' 
              ? 'text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20' 
              : 'text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            }`}
          >
            <Power size={16} />
            {job.status === 'open' ? 'Close Job' : 'Reopen Job'}
          </button>
          <button 
            onClick={() => navigate(`/jobs/edit/${id}`)}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-sm"
          >
            <Edit3 size={16} />
            Edit Posting
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30">
                <Building2 size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{job.title}</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{job.department} • {job.experience_range} Experience</p>
              </div>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">About the Role</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{job.description || 'No description provided.'}</p>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills?.map((skill: string) => (
                  <span key={skill} className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-100 dark:border-slate-700 text-sm font-bold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">Job Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Candidates</p>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-indigo-500 dark:text-indigo-400" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{candidateCount}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Status</p>
                <span className={`text-sm font-bold capitalize ${job.status === 'open' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {job.status}
                </span>
              </div>
            </div>
            <button 
              onClick={() => navigate('/candidates')}
              className="w-full mt-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex items-center justify-center gap-2"
            >
              View Pipeline
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Hiring Manager</h3>
            <div className="flex items-center gap-4">
              <img 
                src={job.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${job.profiles?.full_name}`} 
                className="w-12 h-12 rounded-full border-2 border-slate-50 dark:border-slate-700"
                alt="Manager"
              />
              <div className="overflow-hidden">
                <p className="font-bold text-slate-900 dark:text-white truncate">{job.profiles?.full_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{job.profiles?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
