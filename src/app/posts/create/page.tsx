
import { Header } from '@/components/Header';
import { PostForm } from '@/components/PostForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreatePostPage() {
  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button asChild variant="default" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Posts
            </Link>
          </Button>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-foreground">Create New Post</CardTitle>
            <CardDescription>Share your thoughts with the world.</CardDescription>
          </CardHeader>
          <CardContent>
            <PostForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
