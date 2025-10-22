/**
 * Daily Reports Actions
 * Export all daily report server actions
 */

export { createDailyReport } from './create-daily-report';
export { updateDailyReport } from './update-daily-report';
export { submitDailyReport } from './submit-daily-report';
export { approveDailyReport } from './approve-daily-report';
export { copyFromPreviousReport } from './copy-from-previous';
export { uploadPhoto, confirmPhotoUpload } from './upload-photos';
export { deleteAttachment, deleteAttachments } from './delete-attachment';

export * from './entries';

export type { CreateDailyReportInput, CreateDailyReportResult } from './create-daily-report';
export type { UpdateDailyReportInput, UpdateDailyReportResult } from './update-daily-report';
export type { SubmitDailyReportInput, SubmitDailyReportResult } from './submit-daily-report';
export type { ApproveDailyReportInput, ApproveDailyReportResult } from './approve-daily-report';
export type { CopyFromPreviousInput, CopyFromPreviousResult } from './copy-from-previous';
export type { UploadPhotoInput, UploadPhotoResult } from './upload-photos';
export type { DeleteAttachmentInput, DeleteAttachmentResult } from './delete-attachment';
