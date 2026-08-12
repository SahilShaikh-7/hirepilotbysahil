
import { Interview, Candidate, Job } from '../types';

export const generateICS = (interview: Interview, candidate: Candidate, job: Job) => {
  const start = new Date(interview.start_time).toISOString().replace(/-|:|\.\d+/g, '');
  const end = new Date(interview.end_time).toISOString().replace(/-|:|\.\d+/g, '');
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HirePath//ATS//EN',
    'BEGIN:VEVENT',
    `UID:${interview.id}@hirepath.com`,
    `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d+/g, '')}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:Interview for ${job.title} - ${candidate.full_name}`,
    `DESCRIPTION:Meeting Link: ${interview.meeting_link || 'N/A'}\\nCandidate: ${candidate.full_name}`,
    `LOCATION:${interview.location || 'Virtual'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `interview-${interview.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const sendNotification = async (type: string, data: any) => {
  // In a real production system, this would call an Express backend endpoint
  // which uses Nodemailer/Gmail SMTP.
  console.log(`[Notification Service] Sending ${type} email to ${data.recipient}`);
  console.log(`[Details]`, data);
  
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1000));
  
  return { success: true };
};
