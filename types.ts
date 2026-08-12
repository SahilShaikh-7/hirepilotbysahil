
export type UserRole = 'admin' | 'recruiter' | 'interviewer' | 'candidate';
export type JobStatus = 'open' | 'closed' | 'draft';
export type ApplicationStatus = 'applied' | 'shortlisted' | 'interview_scheduled' | 'selected' | 'rejected';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type InterviewType = 'phone_screen' | 'technical' | 'cultural' | 'managerial' | 'final';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: UserRole;
  created_at: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  description: string;
  skills: string[];
  experience_range: string;
  hiring_manager_id: string;
  status: JobStatus;
  created_at: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  resume_url: string;
  linkedin_url: string;
  professional_role?: string;
  source?: string;
  created_at: string;
  applications?: Application[];
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  current_stage_index: number;
  notes: string;
  created_at: string;
  jobs?: Job;
  candidates?: Candidate;
}

export interface Interview {
  id: string;
  application_id: string;
  title: string;
  start_time: string;
  end_time: string;
  type: InterviewType;
  status: InterviewStatus;
  meeting_link?: string;
  location?: string;
  applications?: {
    jobs?: Job;
    candidates?: Candidate;
  };
  participants?: {
    interviewer_id: string;
    profiles?: Profile;
  }[];
}

export interface Feedback {
  id: string;
  interview_id: string;
  interviewer_id: string;
  rating: number;
  comments: string;
  created_at: string;
  profiles?: Profile;
}