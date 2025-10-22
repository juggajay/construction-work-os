/**
 * Submittal Email Notifications
 * Send email notifications for submittal workflow events
 *
 * TODO: Configure email service (SendGrid/Postmark/Resend)
 * TODO: Create email templates using React Email
 * TODO: Add environment variables for email service API keys
 */

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface SubmittalEmailData {
  submittalId: string;
  submittalNumber: string;
  submittalTitle: string;
  projectName: string;
  projectUrl: string;
}

/**
 * Send notification when submittal is assigned for review
 */
export async function sendSubmittalAssignedEmail(
  recipient: EmailRecipient,
  submittalData: SubmittalEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Implement email sending with your provider
    console.log('[EMAIL STUB] Submittal Assigned:', {
      to: recipient.email,
      subject: `Review Required: ${submittalData.submittalNumber} - ${submittalData.submittalTitle}`,
      submittal: submittalData,
    });

    // Stub: Return success
    return { success: true };

    // Example implementation with SendGrid:
    // const msg = {
    //   to: recipient.email,
    //   from: process.env.FROM_EMAIL,
    //   subject: `Review Required: ${submittalData.submittalNumber}`,
    //   html: renderSubmittalAssignedTemplate(recipient, submittalData),
    // };
    // await sgMail.send(msg);
    // return { success: true };
  } catch (error) {
    console.error('Error sending submittal assigned email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send notification when submittal is approved
 */
export async function sendSubmittalApprovedEmail(
  recipient: EmailRecipient,
  submittalData: SubmittalEmailData,
  approverName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[EMAIL STUB] Submittal Approved:', {
      to: recipient.email,
      subject: `Approved: ${submittalData.submittalNumber} - ${submittalData.submittalTitle}`,
      approvedBy: approverName,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending submittal approved email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send notification when revision is requested
 */
export async function sendRevisionRequestedEmail(
  recipient: EmailRecipient,
  submittalData: SubmittalEmailData,
  reviewerName: string,
  comments: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[EMAIL STUB] Revision Requested:', {
      to: recipient.email,
      subject: `Revision Required: ${submittalData.submittalNumber}`,
      reviewer: reviewerName,
      comments: comments.substring(0, 100) + '...',
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending revision requested email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send notification when submittal is rejected
 */
export async function sendSubmittalRejectedEmail(
  recipient: EmailRecipient,
  submittalData: SubmittalEmailData,
  reviewerName: string,
  comments: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[EMAIL STUB] Submittal Rejected:', {
      to: recipient.email,
      subject: `Rejected: ${submittalData.submittalNumber}`,
      reviewer: reviewerName,
      comments: comments.substring(0, 100) + '...',
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending submittal rejected email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send reminder email for pending review
 */
export async function sendReviewReminderEmail(
  recipient: EmailRecipient,
  submittalData: SubmittalEmailData,
  daysPending: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[EMAIL STUB] Review Reminder:', {
      to: recipient.email,
      subject: `Reminder: Review Pending ${daysPending} days - ${submittalData.submittalNumber}`,
      daysPending,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending review reminder email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send procurement deadline alert to project managers
 */
export async function sendProcurementDeadlineAlert(
  recipient: EmailRecipient,
  overdueSubmittals: Array<{
    number: string;
    title: string;
    daysOverdue: number;
    procurementDeadline: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[EMAIL STUB] Procurement Deadline Alert:', {
      to: recipient.email,
      subject: `Procurement Alert: ${overdueSubmittals.length} Overdue Submittals`,
      overdueCount: overdueSubmittals.length,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending procurement deadline alert:', error);
    return { success: false, error: String(error) };
  }
}
