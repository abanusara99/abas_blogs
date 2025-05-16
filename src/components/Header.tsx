
import Link from 'next/link';
import { PlusCircle, Info } from 'lucide-react'; // Added Info icon
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="py-6 mb-8 border-b border-border shadow-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-3 items-center">
        <div className="col-span-1 flex justify-start">
          <Button asChild variant="destructive" size="sm">
            <Link href="https://anuportfoliovisit.vercel.app/" target="_blank" rel="noopener noreferrer">
              <Info className="mr-2 h-4 w-4" />
              About
            </Link>
          </Button>
        </div>
        <Link href="/" className="col-span-1 text-3xl font-bold text-foreground hover:opacity-80 transition-opacity text-center">
          ABASBlogs
        </Link>
        <div className="col-span-1 flex justify-end">
          <Button asChild variant="default">
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
