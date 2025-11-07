/**
 * Permission Constants and Types
 * Defines all available permissions in the system
 */

export type Permission =
  // Project permissions
  | 'view_project'
  | 'edit_project'
  | 'delete_project'
  // Budget permissions
  | 'view_budget'
  | 'edit_budget'
  // Cost permissions
  | 'view_costs'
  | 'create_cost'
  | 'edit_cost'
  | 'delete_cost'
  // Change order permissions
  | 'view_change_orders'
  | 'create_change_order'
  | 'approve_change_order'
  // Daily report permissions
  | 'view_daily_reports'
  | 'create_daily_report'
  | 'edit_daily_report'
  // RFI permissions
  | 'view_rfis'
  | 'submit_rfi'
  | 'respond_to_rfi'
  | 'close_rfi'
  // Submittal permissions
  | 'view_submittals'
  | 'create_submittal'
  | 'review_submittal'
  | 'approve_submittal'
  // Team permissions
  | 'view_team'
  | 'manage_team'

/**
 * Maps frontend permissions to database RPC function names
 */
export const PERMISSION_RPC_MAPPING: Record<Permission, string | null> = {
  // Project
  view_project: null, // Handled by user_project_ids()
  edit_project: 'can_edit_project',
  delete_project: 'can_delete_project',
  // Budget
  view_budget: null, // All project members can view
  edit_budget: 'can_edit_budget',
  // Costs
  view_costs: null, // All project members can view
  create_cost: 'can_create_cost',
  edit_cost: 'can_edit_cost',
  delete_cost: 'can_delete_cost',
  // Change Orders
  view_change_orders: null, // All project members can view
  create_change_order: 'can_create_change_order',
  approve_change_order: 'can_approve_change_order',
  // Daily Reports
  view_daily_reports: null, // All project members can view
  create_daily_report: 'can_create_daily_report',
  edit_daily_report: 'can_edit_daily_report',
  // RFIs
  view_rfis: null, // All project members can view
  submit_rfi: 'can_submit_rfi',
  respond_to_rfi: 'can_respond_to_rfi',
  close_rfi: 'can_close_rfi',
  // Submittals
  view_submittals: null, // All project members can view
  create_submittal: 'can_create_submittal',
  review_submittal: 'can_review_submittal',
  approve_submittal: 'can_approve_submittal',
  // Team
  view_team: null, // All project members can view
  manage_team: 'can_manage_team',
}

/**
 * Permission descriptions for UI display
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  view_project: 'View project details',
  edit_project: 'Edit project information',
  delete_project: 'Delete projects',
  view_budget: 'View project budgets',
  edit_budget: 'Edit and allocate budgets',
  view_costs: 'View project costs',
  create_cost: 'Create new costs',
  edit_cost: 'Edit existing costs',
  delete_cost: 'Delete costs',
  view_change_orders: 'View change orders',
  create_change_order: 'Create change orders',
  approve_change_order: 'Approve change orders',
  view_daily_reports: 'View daily reports',
  create_daily_report: 'Create daily reports',
  edit_daily_report: 'Edit daily reports',
  view_rfis: 'View RFIs',
  submit_rfi: 'Submit RFIs',
  respond_to_rfi: 'Respond to RFIs',
  close_rfi: 'Close RFIs',
  view_submittals: 'View submittals',
  create_submittal: 'Create submittals',
  review_submittal: 'Review submittals',
  approve_submittal: 'Approve submittals',
  view_team: 'View team members',
  manage_team: 'Manage team members',
}
