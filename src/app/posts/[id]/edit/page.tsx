
import { Header } from '@/components/Header';
import { PostForm } from '@/components/PostForm';
import { getPostById } from '@/lib/actions';
import type { Post } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/authActions';

interface EditPostPageProps {
  params: {
    id: string;
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/?error=unauthorized'); // Redirect if not admin
  }

  const post = await getPostById(params.id);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button asChild variant="default" size="sm">
            <Link href={`/posts/${post.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Post
            </Link>
          </Button>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-foreground">Edit Post</CardTitle>
            <CardDescription>Make changes to your existing blog post.</CardDescription>
          </CardHeader>
          <CardContent>
            <PostForm post={post} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
