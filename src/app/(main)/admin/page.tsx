import { redirect } from 'next/navigation';

/**
 * Admin index page - redirects to the default admin tab (Moderation).
 * Access control is handled by the layout.
 */
export default function AdminPage() {
  redirect('/admin/moderation');
}
