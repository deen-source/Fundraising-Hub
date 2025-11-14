/**
 * Admin utilities for restricted features
 */

const ADMIN_EMAILS = [
  'deen@arconiccap.com',
  'alan@arconiccap.com',
  'anthony@arconiccap.com',
  'nick@arconiccap.com',
];

/**
 * Check if a user email is an admin
 */
export const isAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Get list of admin emails (for reference)
 */
export const getAdminEmails = (): string[] => {
  return [...ADMIN_EMAILS];
};
