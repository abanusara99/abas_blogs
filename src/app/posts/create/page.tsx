import { Header } from '@/components/Header';
import { PostForm } from '@/components/PostForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreatePostPage() {
  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-xl animate-in fade-in-0 duration-500">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">Create New Post</CardTitle>
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
