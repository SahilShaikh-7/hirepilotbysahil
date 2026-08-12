
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase, logActivity } from '../services/supabase';
import { Profile, JobStatus } from '../types';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Plus, 
  UserCircle, 
  RefreshCw, 
  UserPlus,
  AlertCircle,
  Check
} from 'lucide-react';

const JobForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [fetchingManagers, setFetchingManagers] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    experience_range: '',
    hiring_manager_id: '',
    status: 'open' as JobStatus,
    skills: [] as string[]
  });
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    fetchManagers();
    if (id) fetchJob();
  }, [id]);

  const fetchManagers = async () => {
    setFetchingManagers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'recruiter'])
        .order('full_name');
      
      if (error) throw error;
      setManagers(data || []);
    } catch (err) {
      console.error("Error loading managers:", err);
    } finally {
      setFetchingManagers(false);
    }
  };

  const fetchJob = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    if (data) setFormData(data);
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData({ ...formData, skills: [...formData.skills, trimmed] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hiring_manager_id) {
      alert("Please select a hiring manager for this role.");
      return;
    }

    setLoading(true);
    try {
      if (id) {
        const { error } = await supabase
          .from('jobs')
          .update(formData)
          .eq('id', id);
        if (error) throw error;
        await logActivity('Job Updated', `Modified posting for ${formData.title}`, 'info');
      } else {
        const { error } = await supabase
          .from('jobs')
          .insert([formData]);
        if (error) throw error;
        await logActivity('Job Published', `New role opened: ${formData.title}`, 'success');
      }
      navigate('/jobs');
    } catch (err: any) {
      alert(err.message || 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-semibold bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl dark:shadow-none overflow-hidden">
        <div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {id ? 'Update Job Details' : 'Launch New Career Opportunity'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Provide clear requirements to attract the best talent.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Job Title</label>
              <input 
                required
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-normal"
                placeholder="e.g. Lead Product Designer"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Department</label>
                <input 
                  required
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-900 dark:text-white"
                  placeholder="e.g. Design, Engineering"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Experience Level</label>
                <input 
                  required
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-900 dark:text-white"
                  placeholder="e.g. 5-10 years"
                  value={formData.experience_range}
                  onChange={(e) => setFormData({...formData, experience_range: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-3 ml-1">
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Assign Hiring Manager</label>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={fetchManagers}
                      title="Refresh manager list"
                      className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-indigo-500 ${fetchingManagers ? 'animate-spin' : ''}`}
                    >
                      <RefreshCw size={14} />
                    </button>
                    <Link 
                      to="/managers" 
                      className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 uppercase tracking-tighter"
                    >
                      <UserPlus size={12} /> New Manager
                    </Link>
                  </div>
                </div>
                <div className="relative">
                  <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={20} />
                  <select 
                    required
                    className="w-full pl-14 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all appearance-none text-sm font-bold text-slate-900 dark:text-white cursor-pointer disabled:opacity-50"
                    value={formData.hiring_manager_id}
                    disabled={fetchingManagers}
                    onChange={(e) => setFormData({...formData, hiring_manager_id: e.target.value})}
                  >
                    <option value="">Select a Manager...</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Posting Status</label>
                <div className="flex gap-2">
                  {(['open', 'draft', 'closed'] as JobStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({...formData, status})}
                      className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl border transition-all ${
                        formData.status === status 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg' 
                        : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Role Description</label>
            <textarea 
              rows={8}
              required
              className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all resize-none text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium"
              placeholder="Outline the core responsibilities..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Desired Skills & Expertise</label>
            <div className="flex gap-3 mb-5">
              <input 
                className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 text-sm font-bold text-slate-900 dark:text-white"
                placeholder="e.g. React, TypeScript..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <button 
                type="button"
                onClick={addSkill}
                className="px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center"
              >
                <Plus size={24} />
              </button>
            </div>
            <div className="flex flex-wrap gap-3 p-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl min-h-[64px]">
              {formData.skills.map(skill => (
                <span key={skill} className="flex items-center gap-2 px-5 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black">
                  {skill}
                  <button onClick={() => removeSkill(skill)} type="button" className="text-slate-300 hover:text-rose-500">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-end gap-4">
            <button type="button" onClick={() => navigate('/jobs')} className="px-8 py-4 text-sm font-black text-slate-400 uppercase tracking-widest transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center justify-center gap-3 px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl disabled:opacity-50">
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              {id ? 'Update Job' : 'Publish Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobForm;
