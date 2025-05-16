
import Link from 'next/link';
import { PlusCircle, Info, LogOut, User } from 'lucide-react'; // Added User for consistency if needed, though LoginDialog handles its own icon
import { Button } from '@/components/ui/button';
import { getCurrentAdmin, logout } from '@/lib/authActions';
import type { AdminUser } from '@/lib/authActions';
import { LoginDialog } from './LoginDialog'; // Import the LoginDialog

export async function Header() {
  const admin: AdminUser | null = await getCurrentAdmin();

  const handleLogout = async () => {
    'use server';
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 py-6 mb-8 bg-background/75 backdrop-blur-lg border-b border-border/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-3 items-center">
        <div className="col-span-1 flex justify-start">
          <Button asChild variant="destructive" size="sm">
            <Link href="https://anuportfoliovisit.vercel.app/" target="_blank" rel="noopener noreferrer">
              <Info className="h-4 w-4 sm:mr-2" /> {/* Conditionally apply margin */}
              <span className="hidden sm:inline">About</span>
            </Link>
          </Button>
        </div>
        <Link href="/" className="col-span-1 text-3xl font-bold text-foreground hover:opacity-80 transition-opacity text-center">
          ABASBlogs
        </Link>
        <div className="col-span-1 flex justify-end items-center space-x-2">
          {admin ? (
            <>
              <span className="text-sm text-muted-foreground hidden md:inline">Hi, {admin.username}</span> {/* Show username on md+ */}
              <Button asChild variant="default" data-admin-visibility="true">
                <Link href="/posts/create">
                  <PlusCircle className="h-5 w-5 sm:mr-2" /> {/* Conditionally apply margin */}
                  <span className="hidden sm:inline">Create Post</span>
                </Link>
              </Button>
              <form action={handleLogout}>
                <Button type="submit" variant="outline" size="sm">
                  <LogOut className="h-4 w-4 sm:mr-2" /> {/* Conditionally apply margin */}
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </form>
            </>
          ) : (
            <LoginDialog />
          )}
        </div>
      </div>
    </header>
  );
}
