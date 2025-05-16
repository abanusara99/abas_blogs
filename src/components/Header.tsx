import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="py-6 mb-8 border-b border-border shadow-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-3 items-center">
        <div className="col-span-1">
          {/* Intentionally empty to balance the layout for centering the title */}
        </div>
        <Link href="/" className="col-span-1 text-3xl font-bold text-foreground hover:opacity-80 transition-opacity text-center">
          ABASBlogs
        </Link>
        <div className="col-span-1 flex justify-end">
          <Button asChild variant="outline">
            <Link href="/posts/create">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Post
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
