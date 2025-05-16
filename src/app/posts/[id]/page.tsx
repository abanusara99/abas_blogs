
import { Header } from '@/components/Header';
import { getPostById } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import ReactMarkdown from 'react-markdown';

interface PostPageProps {
  params: {
    id: string;
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPostById(params.id);
  const isAdminMode = process.env.NEXT_PUBLIC_ADMIN_MODE === 'true';

  if (!post) {
    notFound();
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Posts
            </Link>
          </Button>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-4xl font-bold leading-tight">{post.title}</CardTitle>
            <div className="flex justify-between items-center">
              <CardDescription>
                Published on {new Date(post.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardDescription>
              {isAdminMode && <DeleteConfirmationDialog post={post} data-admin-visibility="true" />}
            </div>
          </CardHeader>
          <CardContent>
            <article className="prose prose-lg max-w-none text-foreground/90 leading-relaxed">
              <ReactMarkdown
                components={{
                  // You can customize rendering of specific elements here if needed
                  // For example, to open links in a new tab:
                  a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                }}
              >
                {post.content}
              </ReactMarkdown>
            </article>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
