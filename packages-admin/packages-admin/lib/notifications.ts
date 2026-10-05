/**
 * Notifications System
 * Handles email notifications, webhooks, and user preferences
 */

import { supabase } from '@/lib/supabase';

export type NotificationType = 'email' | 'webhook' | 'in_app';
export type NotificationTemplate =
  | 'lesson_published'
  | 'assessment_available'
  | 'mission_unlocked'
  | 'submission_reviewed'
  | 'score_published'
  | 'team_invitation'
  | 'deadline_reminder';

interface NotificationPayload {
  type: NotificationType;
  template: NotificationTemplate;
  recipient_id?: string;
  team_id?: string;
  stage_id?: string;
  data: Record<string, any>;
}

interface NotificationPreferences {
  email_lessons: boolean;
  email_assessments: boolean;
  email_missions: boolean;
  email_submissions: boolean;
  email_scores: boolean;
  webhook_enabled: boolean;
  webhook_url?: string;
}

/**
 * Send email notification via Resend
 */
export async function sendEmailNotification(
  to: string,
  template: NotificationTemplate,
  data: Record<string, any>
) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@steamfoundry.com',
        to,
        subject: getEmailSubject(template),
        html: getEmailTemplate(template, data),
      }),
    });

    if (!response.ok) {
      throw new Error(`Email send failed: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Email notification error:', error);
    return { success: false, error };
  }
}

/**
 * Send webhook notification
 */
export async function sendWebhookNotification(
  webhookUrl: string,
  event: NotificationTemplate,
  data: Record<string, any>
) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
        'X-Event-Type': event,
        'X-Timestamp': new Date().toISOString(),
      },
      body: JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Webhook notification error:', error);
    return { success: false, error };
  }
}

/**
 * Queue notification for sending
 */
export async function queueNotification(payload: NotificationPayload) {
  try {
    const { error } = await supabase.from('notification_queue').insert([
      {
        notification_type: payload.type,
        template: payload.template,
        recipient_id: payload.recipient_id,
        team_id: payload.team_id,
        stage_id: payload.stage_id,
        payload: payload.data,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Queue notification error:', error);
    return { success: false, error };
  }
}

/**
 * Get user notification preferences
 */
export async function getUserNotificationPreferences(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return defaults if not found
    return (
      data || {
        user_id: userId,
        email_lessons: true,
        email_assessments: true,
        email_missions: true,
        email_submissions: true,
        email_scores: true,
        webhook_enabled: false,
      }
    );
  } catch (error) {
    console.error('Get preferences error:', error);
    return null;
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
) {
  try {
    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Update preferences error:', error);
    return { success: false, error };
  }
}

/**
 * Send reminder notification
 */
export async function sendReminderNotification(
  recipientId: string,
  reminderType: 'deadline' | 'upcoming' | 'follow_up',
  context: Record<string, any>
) {
  try {
    const user = await supabase
      .from('users')
      .select('email, name')
      .eq('id', recipientId)
      .single();

    if (!user.data) {
      throw new Error('User not found');
    }

    const subject = getReminderSubject(reminderType, context);

    await sendEmailNotification(user.data.email, 'deadline_reminder', {
      recipient_name: user.data.name,
      subject,
      ...context,
    });

    return { success: true };
  } catch (error) {
    console.error('Reminder notification error:', error);
    return { success: false, error };
  }
}

/**
 * Get email subject for template
 */
function getEmailSubject(template: NotificationTemplate): string {
  const subjects: Record<NotificationTemplate, string> = {
    lesson_published: '📚 New Lesson Available',
    assessment_available: '✏️ New Assessment Ready',
    mission_unlocked: '🚀 New Mission Unlocked',
    submission_reviewed: '📋 Your Submission Has Been Reviewed',
    score_published: '🏆 Your Scores Are Ready',
    team_invitation: '👥 You\'ve Been Invited to a Team',
    deadline_reminder: '⏰ Upcoming Deadline Reminder',
  };
  return subjects[template];
}

/**
 * Get email HTML template
 */
function getEmailTemplate(templateType: NotificationTemplate, data: Record<string, any>): string {
  const templates: Record<NotificationTemplate, (data: any) => string> = {
    lesson_published: (data) => `
      <h1>New Lesson Available</h1>
      <p>Hello ${data.student_name},</p>
      <p>A new lesson "${data.lesson_title}" has been published in the "${data.level_title}" level.</p>
      <p><a href="${data.lesson_url}">Start Lesson</a></p>
    `,
    assessment_available: (data) => `
      <h1>Assessment Ready</h1>
      <p>Hello ${data.student_name},</p>
      <p>An assessment "${data.assessment_title}" is now available for the "${data.lesson_title}" lesson.</p>
      <p><a href="${data.assessment_url}">Take Assessment</a></p>
    `,
    mission_unlocked: (data) => `
      <h1>New Mission Available</h1>
      <p>Hello ${data.student_name},</p>
      <p>You've unlocked the mission "${data.mission_title}"! Test your skills.</p>
      <p><a href="${data.mission_url}">Start Mission</a></p>
    `,
    submission_reviewed: (data) => `
      <h1>Submission Reviewed</h1>
      <p>Hello ${data.team_name},</p>
      <p>Your submission for "${data.submission_title}" has been reviewed.</p>
      <p>Score: ${data.score}/100</p>
      <p><a href="${data.review_url}">View Feedback</a></p>
    `,
    score_published: (data) => `
      <h1>Scores Published</h1>
      <p>Hello ${data.team_name},</p>
      <p>Your scores for the ${data.stage_name} have been published.</p>
      <p><a href="${data.scores_url}">View Scores</a></p>
    `,
    team_invitation: (data) => `
      <h1>Team Invitation</h1>
      <p>Hello ${data.invitee_name},</p>
      <p>You've been invited to join team "${data.team_name}" for the ${data.stage_name}.</p>
      <p><a href="${data.invitation_url}">Accept Invitation</a></p>
    `,
    deadline_reminder: (data) => `
      <h1>Deadline Reminder</h1>
      <p>Hello ${data.recipient_name},</p>
      <p>Reminder: ${data.subject}</p>
      <p>Deadline: ${data.deadline_date}</p>
    `,
  };

  const template = templates[templateType];
  return template ? template(data) : '<p>Notification</p>';
}

/**
 * Get reminder subject
 */
function getReminderSubject(
  reminderType: 'deadline' | 'upcoming' | 'follow_up',
  context: Record<string, any>
): string {
  switch (reminderType) {
    case 'deadline':
      return `Reminder: ${context.item_name} due in ${context.days_remaining} days`;
    case 'upcoming':
      return `Upcoming: ${context.event_name} starting ${context.start_date}`;
    case 'follow_up':
      return `Follow-up: Action needed for ${context.item_name}`;
    default:
      return 'Reminder';
  }
}

/**
 * Log notification event
 */
export async function logNotificationEvent(
  userId: string,
  eventType: string,
  metadata: Record<string, any>
) {
  try {
    await supabase.from('notification_events').insert([
      {
        user_id: userId,
        event_type: eventType,
        metadata,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    console.error('Log notification error:', error);
  }
}
