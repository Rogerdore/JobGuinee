import { supabase } from '../lib/supabase';

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        metadata: params.metadata || {}
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const notifyNewApplication = async (
  recruiterId: string,
  candidateName: string,
  jobTitle: string,
  applicationId: string,
  jobId: string
) => {
  await createNotification({
    userId: recruiterId,
    type: 'application_received',
    title: 'New Application Received',
    message: `${candidateName} has applied for ${jobTitle}`,
    link: '/recruiter/dashboard',
    metadata: {
      application_id: applicationId,
      job_id: jobId
    }
  });
};

export const notifyApplicationStatusChange = async (
  candidateId: string,
  jobTitle: string,
  status: string,
  applicationId: string
) => {
  let message = '';

  switch (status) {
    case 'reviewed':
      message = `Your application for ${jobTitle} has been reviewed`;
      break;
    case 'shortlisted':
      message = `Great news! You have been shortlisted for ${jobTitle}`;
      break;
    case 'interview':
      message = `Congratulations! You have been selected for an interview for ${jobTitle}`;
      break;
    case 'rejected':
      message = `Your application for ${jobTitle} was not successful this time`;
      break;
    case 'accepted':
      message = `Congratulations! Your application for ${jobTitle} has been accepted`;
      break;
    default:
      message = `Your application status has been updated to ${status}`;
  }

  await createNotification({
    userId: candidateId,
    type: 'application_status_changed',
    title: 'Application Status Updated',
    message,
    link: '/candidate/dashboard',
    metadata: {
      application_id: applicationId,
      status
    }
  });
};

export const notifyProfileViewed = async (
  candidateId: string,
  recruiterName: string,
  companyName?: string
) => {
  await createNotification({
    userId: candidateId,
    type: 'profile_viewed',
    title: 'Profile Viewed',
    message: `${recruiterName}${companyName ? ` from ${companyName}` : ''} viewed your profile`,
    link: '/candidate/dashboard',
    metadata: {
      recruiter_name: recruiterName,
      company_name: companyName
    }
  });
};

export const notifyNewMessage = async (
  receiverId: string,
  senderName: string,
  messagePreview: string,
  applicationId: string
) => {
  await createNotification({
    userId: receiverId,
    type: 'message_received',
    title: 'New Message',
    message: `${senderName}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}`,
    link: '/messages',
    metadata: {
      application_id: applicationId,
      sender_name: senderName
    }
  });
};
