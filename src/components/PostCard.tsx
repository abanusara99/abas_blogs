import Link from 'next/link';
import type { Post } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

interface PostCardProps {
  post: Post;
}

function generateExcerpt(content: string, maxLength: number = 100) {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength).trimEnd() + "...";
}

export function PostCard({ post }: PostCardProps) {
  const excerpt = generateExcerpt(post.content);

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-[0_0_15px_5px_hsl(220,50%,40%)] active:shadow-[0_0_15px_5px_hsl(220,50%,40%)] transition-shadow duration-300 animate-in fade-in-0 duration-500">
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
        <Button asChild variant="accent" size="sm">
          <Link href={`/posts/${post.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Post
          </Link>
        </Button>
        <DeleteConfirmationDialog post={post} />
      </CardFooter>
    </Card>
  );
}
