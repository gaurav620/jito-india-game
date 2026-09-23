import { redirect } from 'next/navigation';

/**
 * Root Route (`/`)
 *
 * Immediately redirects to the splash screen so every session begins
 * with the branded boot sequence before reaching the login screen.
 *
 * NOTE: The previous marketing/landing page has been removed from this route.
 * If a public landing page is needed in the future, create a dedicated route
 * (e.g. `/landing`) and restore the content there.
 */
export default function RootPage() {
  redirect('/splash');
}
