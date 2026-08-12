
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Application, Feedback } from '../types';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Linkedin, 
  FileText, 
  Star, 
  MessageSquare, 
  Calendar,
  ChevronRight,
  Clock,
  ExternalLink,
  Trash2,
  Loader2
} from 'lucide-react';

const CandidateProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<any>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('applications')
      .select('*, candidates(*), jobs(*)')
      .eq('id', id)
      .single();
    
    if (data) setApp(data);
    else if (!loading) {
        console.warn("Application not found");
    }

    // Better fetch for feedback: Get interviews for this app, then feedback for those interviews
    const { data: interviews } = await supabase.from('interviews').select('id').eq('application_id', id);
    if (interviews && interviews.length > 0) {
        const interviewIds = interviews.map(i => i.id);
        const { data: fbData } = await supabase.from('feedback').select('*, profiles:interviewer_id(*)').in('interview_id', interviewIds);
        if (fbData) setFeedback(fbData as any);
    }
    
    setLoading(false);
  };

  const saveNote = async () => {
    const { error } = await supabase
      .from('applications')
      .update({ notes: (app.notes || '') + '\n' + new Date().toLocaleString() + ': ' + newNote })
      .eq('id', id);
    if (!error) {
      setNewNote('');
      fetchProfile();
    }
  };

  const handleDelete = async () => {
    // 1. Identify Candidate ID
    const candidateId = app?.candidate_id || app?.candidates?.id;
    
    if (!candidateId) {
      alert("Error: Could not identify candidate record to delete.");
      return;
    }
    
    if (window.confirm('Are you sure you want to permanently delete this candidate? This action will remove all their applications and interview history.')) {
      setDeleteLoading(true);

      try {
        // 2. Manual Cascade: Delete applications first. 
        // This ensures deletion works even if DB-level CASCADE is missing.
        const { error: appError } = await supabase
            .from('applications')
            .delete()
            .eq('candidate_id', candidateId);

        if (appError) {
            console.error('Error deleting applications:', appError);
            // We continue, because the candidate might not have applications 
        }

        // 3. Delete the Candidate
        const { error, count } = await supabase
            .from('candidates')
            .delete({ count: 'exact' })
            .eq('id', candidateId);

        if (error) {
            throw error;
        } 
        
        // Success or already deleted
        navigate('/candidates');
        
      } catch (err: any) {
        console.error("Delete operation failed:", err);
        
        // Double check if it's actually gone (race condition or cascade success despite error)
        const { data: exists } = await supabase.from('candidates').select('id').eq('id', candidateId).maybeSingle();
        if (!exists) {
            navigate('/candidates');
        } else {
            alert('Failed to delete candidate: ' + err.message);
            setDeleteLoading(false);
        }
      }
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400">Loading candidate history...</div>;
  if (!app) return <div className="p-20 text-center text-slate-400">Candidate application not found.</div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/candidates')} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-bold">
          <ArrowLeft size={18} /> Back to List
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDelete}
            disabled={deleteLoading}
            className="flex items-center gap-2 px-4 py-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl text-sm font-bold transition-all border border-rose-100 dark:border-rose-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete Candidate"
          >
            {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </button>
          <button onClick={() => navigate(`/interviews/new?application_id=${app.id}`)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all">
            Schedule Next Round
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
             <div className="absolute top-0 right-0 p-8">
               <span className="capitalize px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-900/50">
                 {app.status.replace('_', ' ')}
               </span>
             </div>

             <div className="flex items-start gap-6">
               <img 
                 src={`https://ui-avatars.com/api/?name=${app.candidates?.full_name}&size=128&background=random`} 
                 className="w-24 h-24 rounded-3xl"
                 alt=""
               />
               <div className="flex-1 pt-2">
                 <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">{app.candidates?.full_name}</h1>
                 <p className="text-slate-500 dark:text-slate-400 font-medium mb-4">Applying for <span className="text-indigo-600 dark:text-indigo-400 font-bold">{app.jobs?.title || 'General Talent Pool'}</span></p>
                 
                 <div className="flex flex-wrap gap-4">
                    <a href={`mailto:${app.candidates?.email}`} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                      <Mail size={14} /> {app.candidates?.email}
                    </a>
                    {app.candidates?.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                        <Phone size={14} /> {app.candidates?.phone}
                      </div>
                    )}
                    {app.candidates?.linkedin_url && (
                      <a href={app.candidates.linkedin_url} target="_blank" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/50">
                        <Linkedin size={14} /> Profile
                      </a>
                    )}
                 </div>
               </div>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock size={20} className="text-indigo-500" />
              Application Timeline
            </h3>
            <div className="space-y-8 relative before:absolute before:inset-0 before:left-3 before:w-px before:bg-slate-100 dark:before:bg-slate-800 before:z-0">
              {[
                { stage: 'Applied', date: app.created_at, desc: 'Initial application submitted.' },
                { stage: 'Review', date: app.updated_at, desc: 'Candidate moved through stages.' },
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex gap-6">
                  <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{item.stage}</p>
                    <p className="text-xs text-slate-400 font-semibold mb-2">{new Date(item.date).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Star size={20} className="text-orange-400" />
              Interviewer Feedback
            </h3>
            {feedback.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-600 italic text-center py-8">No feedback recorded yet.</p>
            ) : (
              <div className="space-y-6">
                {feedback.map(fb => (
                  <div key={fb.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <img src={fb.profiles?.avatar_url} className="w-6 h-6 rounded-full" alt="" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{fb.profiles?.full_name}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < fb.rating ? 'fill-orange-400 text-orange-400' : 'text-slate-300 dark:text-slate-600'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{fb.comments}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
             <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
               <FileText size={18} className="text-indigo-500" /> Documents
             </h3>
             {app.candidates?.resume_url ? (
               <a 
                 href={app.candidates.resume_url} 
                 target="_blank"
                 className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group"
               >
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg group-hover:scale-110 transition-transform">
                     <FileText size={20} />
                   </div>
                   <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Resume.pdf</span>
                 </div>
                 <ExternalLink size={16} className="text-slate-400" />
               </a>
             ) : (
               <p className="text-xs text-slate-400 italic">No documents attached.</p>
             )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
             <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
               <MessageSquare size={18} className="text-emerald-500" /> Internal Notes
             </h3>
             <div className="max-h-48 overflow-y-auto scrollbar-hide mb-4 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{app.notes || 'No internal notes yet.'}</p>
             </div>
             <div className="relative">
                <textarea 
                  rows={3}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="Add a new note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button 
                  onClick={saveNote}
                  disabled={!newNote.trim()}
                  className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-0 transition-all shadow-lg"
                >
                  <ChevronRight size={16} />
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;
