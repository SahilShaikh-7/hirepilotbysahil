
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Interview, InterviewStatus, Profile } from '../types';
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  XCircle, 
  Edit3,
  Loader2,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  List,
  GripVertical,
  AlertCircle,
  User
} from 'lucide-react';

const STATUS_FILTERS: { label: string; value: InterviewStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); 

const Interviews: React.FC = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [interviewers, setInterviewers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string>('all');
  
  const dragItem = useRef<string | null>(null);

  useEffect(() => {
    fetchInterviews();
    fetchInterviewers();
  }, []);

  const fetchInterviewers = async () => {
    const { data } = await supabase.from('profiles').select('*').in('role', ['admin', 'recruiter', 'interviewer']);
    if (data) setInterviewers(data);
  };

  const fetchInterviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        applications:application_id (
          id,
          jobs:job_id (*),
          candidates:candidate_id (*)
        ),
        participants:interview_participants (
          interviewer_id,
          profiles:interviewer_id (*)
        )
      `)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching interviews:', error);
    } else {
      setInterviews(data as any);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: InterviewStatus) => {
    const { error } = await supabase
      .from('interviews')
      .update({ status })
      .eq('id', id);
    
    if (error) alert('Failed to update status');
    else fetchInterviews();
  };

  const updateInterviewTime = async (id: string, newStartTime: Date) => {
    setUpdating(true);
    const original = interviews.find(i => i.id === id);
    if (!original) return;

    const duration = new Date(original.end_time).getTime() - new Date(original.start_time).getTime();
    const newEndTime = new Date(newStartTime.getTime() + duration);

    const { error } = await supabase
      .from('interviews')
      .update({ 
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
        status: 'scheduled'
      })
      .eq('id', id);

    if (error) alert('Failed to move interview: ' + error.message);
    else await fetchInterviews();
    setUpdating(false);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeekStart(newDate);
  };

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const getInterviewsForSlot = (date: Date, hour: number) => {
    return interviews.filter(int => {
      const start = new Date(int.start_time);
      return start.toDateString() === date.toDateString() && start.getHours() === hour;
    });
  };

  const isInterviewerBusy = (date: Date, hour: number) => {
    if (selectedInterviewerId === 'all') return false;
    return interviews.some(int => {
      const start = new Date(int.start_time);
      const end = new Date(int.end_time);
      const slotTime = new Date(date);
      slotTime.setHours(hour, 0, 0, 0);
      
      const isOverlapping = slotTime >= start && slotTime < end;
      const isParticipant = int.participants?.some(p => p.interviewer_id === selectedInterviewerId);
      
      return isOverlapping && isParticipant && int.status !== 'cancelled';
    });
  };

  const filteredInterviews = interviews.filter(int => {
    const matchesSearch = 
      int.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      int.applications?.candidates?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      int.applications?.jobs?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || int.status === statusFilter;
    const matchesInterviewer = selectedInterviewerId === 'all' || 
      int.participants?.some(p => p.interviewer_id === selectedInterviewerId);

    return matchesSearch && matchesStatus && matchesInterviewer;
  });

  const onDragStart = (e: React.DragEvent, id: string) => {
    dragItem.current = id;
    e.dataTransfer.setData('text/plain', id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, date: Date, hour: number) => {
    e.preventDefault();
    const id = dragItem.current;
    if (id) {
      const newStart = new Date(date);
      newStart.setHours(hour, 0, 0, 0);
      updateInterviewTime(id, newStart);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/20">
              <CalendarDays size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Interviews
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium ml-1">
            Global Recruitment Scheduler • Synchronize talent assessments
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              title="Calendar Navigation"
            >
              <CalendarDays size={18} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              title="Sequential List"
            >
              <List size={18} strokeWidth={2.5} />
            </button>
          </div>
          <button 
            onClick={() => navigate('/interviews/new')}
            className="flex items-center gap-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-xl shadow-slate-200 dark:shadow-none text-sm active:scale-95"
          >
            <Plus size={18} strokeWidth={3} />
            Book Session
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center shadow-sm transition-colors duration-300">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search candidates or titles..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-6 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 dark:text-white transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
          <Filter size={16} className="text-slate-400 ml-2" />
          <select 
            value={selectedInterviewerId}
            onChange={(e) => setSelectedInterviewerId(e.target.value)}
            className="bg-transparent border-none px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">Any Evaluator</option>
            {interviewers.map(i => <option key={i.id} value={i.id}>{i.full_name}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {STATUS_FILTERS.map(filter => (
            <button 
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                statusFilter === filter.value 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none overflow-hidden flex flex-col min-h-[700px] relative transition-colors duration-300">
          {updating && (
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/60 backdrop-blur-[2px] z-[60] flex items-center justify-center">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Syncing...</p>
              </div>
            </div>
          )}
          
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <h2 className="font-bold text-slate-900 dark:text-white text-lg ml-2">
              {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => navigateWeek(-1)} className="p-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all text-slate-500 dark:text-slate-400"><ChevronLeft size={16}/></button>
              <button onClick={() => setCurrentWeekStart(new Date())} className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-all">Today</button>
              <button onClick={() => navigateWeek(1)} className="p-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all text-slate-500 dark:text-slate-400"><ChevronRight size={16}/></button>
            </div>
          </div>

          <div className="grid grid-cols-[80px_repeat(5,1fr)] flex-1 overflow-x-auto bg-white dark:bg-slate-900">
            <div className="bg-slate-50/50 dark:bg-slate-800/20 border-r border-slate-100 dark:border-slate-800"></div>
            {weekDays.map(date => (
              <div key={date.toString()} className={`p-4 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0 ${date.toDateString() === new Date().toDateString() ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <p className={`text-xl font-bold ${date.toDateString() === new Date().toDateString() ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{date.getDate()}</p>
              </div>
            ))}

            {HOURS.map(hour => (
              <React.Fragment key={hour}>
                <div className="p-4 text-right border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tabular-nums">{hour}:00</span>
                </div>
                {weekDays.map(date => {
                  const items = getInterviewsForSlot(date, hour);
                  const busy = isInterviewerBusy(date, hour);
                  return (
                    <div 
                      key={`${date}-${hour}`} 
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(e, date, hour)}
                      className={`relative border-t border-r border-slate-100 dark:border-slate-800 last:border-r-0 min-h-[120px] transition-all p-2 ${busy ? 'bg-rose-50/30 dark:bg-rose-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}
                    >
                      {busy && !items.length && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                          <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest rotate-45">OCCUPIED</span>
                        </div>
                      )}
                      <div className="space-y-2">
                        {items.map(int => (
                          <div 
                            key={int.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, int.id)}
                            onClick={() => navigate(`/candidates/${int.application_id}`)}
                            className={`p-3 rounded-2xl text-left border cursor-move shadow-sm hover:shadow-lg transition-all group animate-in zoom-in duration-300 ${
                              int.status === 'cancelled' ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60 text-slate-500' : 
                              int.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300' : 'bg-indigo-600 dark:bg-indigo-600 border-indigo-500 text-white'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <GripVertical size={10} className={int.status === 'scheduled' ? 'text-indigo-300' : 'text-current opacity-50'} />
                                <span className="text-[8px] font-bold uppercase tracking-widest truncate">{int.title}</span>
                            </div>
                            <p className="text-[11px] font-bold truncate mb-2">{int.applications?.candidates?.full_name}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex -space-x-1">
                                 {int.participants?.slice(0, 3).map((p, idx) => (
                                   <img key={idx} src={p.profiles?.avatar_url} className="w-4 h-4 rounded-full border border-white dark:border-slate-800 bg-slate-100" alt="" />
                                 ))}
                              </div>
                              <span className="text-[9px] font-bold opacity-80">
                                {new Date(int.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
               <List size={40} className="mx-auto mb-4 text-slate-100 dark:text-slate-800" />
               <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">No interviews found</p>
            </div>
          ) : (
            filteredInterviews.map((int) => (
              <div key={int.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-slate-900 dark:text-white group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{new Date(int.start_time).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-xl font-bold leading-none">{new Date(int.start_time).getDate()}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white tracking-tight text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{int.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1.5 font-bold"><User size={12} className="text-indigo-500 dark:text-indigo-400" />{int.applications?.candidates?.full_name}</span>
                      <span className="flex items-center gap-1.5"><Clock size={12} />{new Date(int.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => navigate(`/interviews/edit/${int.id}`)}
                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 rounded-xl transition-all"
                    title="Edit"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => updateStatus(int.id, 'cancelled')}
                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 rounded-xl transition-all"
                    title="Cancel"
                  >
                    <XCircle size={18} />
                  </button>
                  <button 
                    onClick={() => navigate(`/candidates/${int.application_id}`)}
                    className="p-3 text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all ml-2"
                  >
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Interviews;
