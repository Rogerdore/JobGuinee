import { Interview } from './interviewSchedulingService';

export interface ICSEvent {
  summary: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  organizer?: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    name: string;
    email: string;
  }>;
}

export const calendarExportService = {
  formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
  },

  escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  },

  generateICS(event: ICSEvent): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//JobGuinée//Interview Scheduler//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@jobguinee.com`,
      `DTSTAMP:${this.formatDate(new Date())}`,
      `DTSTART:${this.formatDate(event.startDate)}`,
      `DTEND:${this.formatDate(event.endDate)}`,
      `SUMMARY:${this.escapeICSText(event.summary)}`,
      `DESCRIPTION:${this.escapeICSText(event.description)}`,
      `LOCATION:${this.escapeICSText(event.location)}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0'
    ];

    if (event.organizer) {
      lines.push(`ORGANIZER;CN=${this.escapeICSText(event.organizer.name)}:mailto:${event.organizer.email}`);
    }

    if (event.attendees && event.attendees.length > 0) {
      event.attendees.forEach(attendee => {
        lines.push(`ATTENDEE;CN=${this.escapeICSText(attendee.name)};RSVP=TRUE:mailto:${attendee.email}`);
      });
    }

    lines.push(
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Rappel entretien dans 2 heures',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Rappel entretien demain',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    );

    return lines.join('\r\n');
  },

  generateInterviewICS(
    interview: Interview,
    recruiterName: string,
    recruiterEmail: string,
    candidateName: string,
    candidateEmail: string,
    jobTitle: string
  ): string {
    const startDate = new Date(interview.scheduled_at);
    const endDate = new Date(startDate.getTime() + interview.duration_minutes * 60000);

    const typeLabels = {
      visio: 'Visioconférence',
      presentiel: 'En présentiel',
      telephone: 'Téléphone'
    };

    const event: ICSEvent = {
      summary: `Entretien d'embauche - ${jobTitle}`,
      description: `Type: ${typeLabels[interview.interview_type]}\n\nCandidat: ${candidateName}\nRecruteur: ${recruiterName}\n\n${interview.notes || ''}`,
      location: interview.location_or_link,
      startDate,
      endDate,
      organizer: {
        name: recruiterName,
        email: recruiterEmail
      },
      attendees: [
        {
          name: candidateName,
          email: candidateEmail
        }
      ]
    };

    return this.generateICS(event);
  },

  downloadICS(icsContent: string, filename: string = 'entretien.ics'): void {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },

  getGoogleCalendarLink(interview: Interview, jobTitle: string): string {
    const startDate = new Date(interview.scheduled_at);
    const endDate = new Date(startDate.getTime() + interview.duration_minutes * 60000);

    const formatGoogleDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Entretien d'embauche - ${jobTitle}`,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: `Type: ${interview.interview_type}\nLieu/Lien: ${interview.location_or_link}`,
      location: interview.location_or_link
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  },

  getOutlookCalendarLink(interview: Interview, jobTitle: string): string {
    const startDate = new Date(interview.scheduled_at);
    const endDate = new Date(startDate.getTime() + interview.duration_minutes * 60000);

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: `Entretien d'embauche - ${jobTitle}`,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      body: `Type: ${interview.interview_type}\nLieu/Lien: ${interview.location_or_link}`,
      location: interview.location_or_link
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }
};
