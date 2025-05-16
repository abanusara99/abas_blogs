import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="py-6 mb-8 border-b border-border shadow-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link href="/" className="text-3xl font-bold text-primary hover:opacity-80 transition-opacity">
          BlogLite
        </Link>
        <Button asChild variant="outline">
          <Link href="/posts/create">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Post
          </Link>
        </Button>
      </div>
    </header>
  );
}
