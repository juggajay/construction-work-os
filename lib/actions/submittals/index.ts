/**
 * Submittals Server Actions
 * Export all submittal-related server actions
 */

// CRUD Operations
export { createSubmittal } from './create-submittal';
export type { CreateSubmittalInput, CreateSubmittalResult } from './create-submittal';

export { updateSubmittal } from './update-submittal';
export type { UpdateSubmittalInput, UpdateSubmittalResult } from './update-submittal';

// Review Workflow
export { submitForReview } from './submit-for-review';
export type { SubmitForReviewInput, SubmitForReviewResult } from './submit-for-review';

export { reviewSubmittal } from './review-submittal';
export type { ReviewSubmittalInput, ReviewSubmittalResult } from './review-submittal';

export { createResubmittal } from './create-resubmittal';
export type { CreateResubmittalInput, CreateResubmittalResult } from './create-resubmittal';

// Attachments
export { uploadAttachment } from './upload-attachment';
export type { UploadAttachmentInput, UploadAttachmentResult } from './upload-attachment';

export { deleteAttachment } from './delete-attachment';
export type { DeleteAttachmentInput, DeleteAttachmentResult } from './delete-attachment';

// Queries
export { getSubmittalList } from './get-submittal-list';
export type { GetSubmittalListInput, GetSubmittalListResult, SubmittalListItem } from './get-submittal-list';

export { getSubmittalDetail } from './get-submittal-detail';
export type { GetSubmittalDetailInput, GetSubmittalDetailResult, SubmittalDetail } from './get-submittal-detail';

export { getMyPendingReviews } from './get-my-pending-reviews';
export type { GetMyPendingReviewsInput, GetMyPendingReviewsResult, PendingReview } from './get-my-pending-reviews';

// Schemas (for client-side validation)
export * from './schemas';
