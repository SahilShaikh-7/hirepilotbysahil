
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase, logActivity } from '../services/supabase';
import { Application, Profile, InterviewType } from '../types';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Link as LinkIcon, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  ChevronRight,
  Edit2
} from 'lucide-react';

const ScheduleInterview: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const initialAppId = searchParams.get('application_id');
  const initialDate = searchParams.get('date');
  const initialHour = searchParams.get('hour');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviewers, setInterviewers] = useState<Profile[]>([]);
  const [conflict, setConflict] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    application_id: initialAppId || '',
    title: '',
    type: 'technical' as InterviewType,
    start_time: initialDate && initialHour ? `${initialDate}T${initialHour.padStart(2, '0')}:00` : '',
    duration: 60,
    meeting_link: '',
    selected_interviewer_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      const { data: apps } = await supabase.from('applications').select('*, candidates(*), jobs(*)');
      const { data: users } = await supabase.from('profiles').select('*').in('role', ['admin', 'recruiter', 'interviewer']);
      
      if (apps) setApplications(apps as any);
      if (users) setInterviewers(users);

      if (id) {
        const { data: int } = await supabase
          .from('interviews')
          .select(`*, participants:interview_participants (interviewer_id)`)
          .eq('id', id)
          .single();
        
        if (int) {
          const start = new Date(int.start_time);
          const end = new Date(int.end_time);
          const duration = Math.round((end.getTime() - start.getTime()) / 60000);
          const localTimeStr = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

          setFormData({
            application_id: int.application_id,
            title: int.title,
            type: int.type,
            start_time: localTimeStr,
            duration: duration,
            meeting_link: int.meeting_link || '',
            selected_interviewer_id: int.participants?.[0]?.interviewer_id || ''
          });
        }
      }
      setFetching(false);
    };
    fetchData();
  }, [id]);

  const checkConflict = async () => {
    if (!formData.selected_interviewer_id || !formData.start_time) return;
    
    const start = new Date(formData.start_time);
    const end = new Date(start.getTime() + formData.duration * 60000);

    const { data } = await supabase.rpc('detect_interview_conflicts', {
      p_interviewer_id: formData.selected_interviewer_id,
      p_start: start.toISOString(),
      p_end: end.toISOString()
    });

    if (data) setConflict("Warning: Potential schedule overlap for this interviewer.");
    else setConflict(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const start = new Date(formData.start_time).toISOString();
      const end = new Date(new Date(formData.start_time).getTime() + formData.duration * 60000).toISOString();
      const candidateName = applications.find(a => a.id === formData.application_id)?.candidates?.full_name || 'Candidate';

      if (id) {
        await supabase
          .from('interviews')
          .update({
            application_id: formData.application_id,
            title: formData.title,
            type: formData.type,
            start_time: start,
            end_time: end,
            meeting_link: formData.meeting_link,
          })
          .eq('id', id);

        await supabase.from('interview_participants').delete().eq('interview_id', id);
        await supabase.from('interview_participants').insert([{
          interview_id: id,
          interviewer_id: formData.selected_interviewer_id
        }]);

        await logActivity('Interview Rescheduled', `${formData.title} with ${candidateName} was updated`, 'info');
      } else {
        const { data: interview, error: intError } = await supabase
          .from('interviews')
          .insert([{
            application_id: formData.application_id,
            title: formData.title || 'Technical Interview',
            type: formData.type,
            start_time: start,
            end_time: end,
            meeting_link: formData.meeting_link,
            status: 'scheduled'
          }])
          .select()
          .single();

        if (intError) throw intError;
        
        await supabase.from('interview_participants').insert([{
          interview_id: interview.id,
          interviewer_id: formData.selected_interviewer_id
        }]);

        await supabase.from('applications')
          .update({ status: 'interview_scheduled' })
          .eq('id', formData.application_id);

        await logActivity('Interview Scheduled', `${formData.title} booked for ${candidateName}`, 'success');
      }

      navigate('/interviews');
    } catch (err: any) {
      alert(err.message || 'Error processing interview');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Accessing Calendar Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-bold bg-white dark:bg-slate-900 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl dark:shadow-none overflow-hidden">
        <div className="p-10 md:p-14 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              {id ? <Edit2 className="text-indigo-600 dark:text-indigo-400" size={28} /> : <Sparkles className="text-indigo-600 dark:text-indigo-400" size={28} />}
              {id ? 'Reschedule Interview' : 'Schedule Interview'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
              {id ? `Adjusting details for: ${formData.title}` : 'Coordinate calendars and set meeting parameters.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 md:p-14 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Select Candidate & Position</label>
              <div className="relative">
                <select 
                  required
                  disabled={!!id} 
                  className="w-full pl-6 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all appearance-none text-base font-bold text-slate-900 dark:text-white cursor-pointer disabled:opacity-60"
                  value={formData.application_id}
                  onChange={(e) => setFormData({...formData, application_id: e.target.value})}
                >
                  <option value="">Choose from current pipeline...</option>
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.candidates?.full_name} — {app.jobs?.title}
                    </option>
                  ))}
                </select>
                {!id && <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronRight className="rotate-90" size={18} /></div>}
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Interview Title</label>
              <input 
                required
                placeholder="e.g. Technical Deep Dive"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 text-sm font-bold text-slate-900 dark:text-white"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Session Type</label>
              <select 
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 text-sm font-bold text-slate-900 dark:text-white cursor-pointer appearance-none"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
              >
                <option value="phone_screen">Phone Screen</option>
                <option value="technical">Technical Assessment</option>
                <option value="cultural">Cultural Evaluation</option>
                <option value="managerial">Leadership Review</option>
                <option value="final">Final Executive Round</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Start Date & Time</label>
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                <input 
                  required
                  type="datetime-local"
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 text-sm font-bold text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  value={formData.start_time}
                  onChange={(e) => {
                    setFormData({...formData, start_time: e.target.value});
                    setTimeout(checkConflict, 200);
                  }}
                />
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Duration</label>
              <div className="relative">
                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                <select 
                  className="w-full pl-14 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 text-sm font-bold text-slate-900 dark:text-white cursor-pointer appearance-none"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={90}>1.5 Hours</option>
                  <option value={120}>2 Hours</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2 pt-4">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Assign Lead Interviewer</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                <select 
                  required
                  className={`w-full pl-14 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 text-sm font-bold text-slate-900 dark:text-white cursor-pointer appearance-none ${conflict ? 'border-rose-300 dark:border-rose-900' : ''}`}
                  value={formData.selected_interviewer_id}
                  onChange={(e) => {
                    setFormData({...formData, selected_interviewer_id: e.target.value});
                    setTimeout(checkConflict, 200);
                  }}
                >
                  <option value="">Assign a team member...</option>
                  {interviewers.map(user => (
                    <option key={user.id} value={user.id}>{user.full_name} ({user.role})</option>
                  ))}
                </select>
                {conflict && (
                  <div className="mt-3 flex items-start gap-2 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-tight bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 animate-in shake duration-500">
                    <ShieldAlert size={16} className="shrink-0" /> {conflict}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 pt-4">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Meeting Link (Virtual Environment)</label>
              <div className="relative">
                <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                <input 
                  placeholder="https://zoom.us/j/..."
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 text-sm font-bold text-slate-900 dark:text-white"
                  value={formData.meeting_link}
                  onChange={(e) => setFormData({...formData, meeting_link: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-end gap-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="px-10 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-3 px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-2xl shadow-indigo-200 dark:shadow-none disabled:opacity-50 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {id ? 'Commit Changes' : 'Publish Invitation'}
                  <CheckCircle2 size={20} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleInterview;
