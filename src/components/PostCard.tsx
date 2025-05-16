
import Link from 'next/link';
import type { Post } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

interface PostCardProps {
  post: Post;
  isAdmin: boolean; // Added isAdmin prop
}

function generateExcerpt(content: string, maxLength: number = 100) {
  const trimmedContent = content.trim();
  if (trimmedContent.length <= maxLength) {
    return trimmedContent;
  }
  const sub = trimmedContent.substring(0, maxLength);
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace > 0) {
    return sub.substring(0, lastSpace).trimEnd() + "...";
  }
  return sub.trimEnd() + "...";
}


export function PostCard({ post, isAdmin }: PostCardProps) {
  const excerpt = generateExcerpt(post.content);

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-[0_0_15px_5px_hsl(var(--primary))] active:shadow-[0_0_15px_5px_hsl(var(--primary))] transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-2xl hover:text-primary transition-colors">
          <Link href={`/posts/${post.id}`}>{post.title}</Link>
        </CardTitle>
        <CardDescription>
          {new Date(post.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">{excerpt}</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button asChild variant="default" size="sm">
          <Link href={`/posts/${post.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Post
          </Link>
        </Button>
        {isAdmin && <DeleteConfirmationDialog post={post} data-admin-visibility="true" />}
      </CardFooter>
    </Card>
  );
}
