import { Header } from '@/components/Header';
import { PostCard } from '@/components/PostCard';
import { getPosts } from '@/lib/actions';
import type { Post } from '@/types';

export default async function HomePage() {
  const posts: Post[] = await getPosts();

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-10 text-center text-primary">Latest Posts</h1>
        {posts.length === 0 ? (
          <p className="text-center text-muted-foreground text-lg">No posts yet. Be the first to create one!</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
