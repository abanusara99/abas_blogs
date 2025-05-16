import type { Post } from '@/types';

// In-memory store for posts
export let posts: Post[] = [
  {
    id: '1',
    title: 'Getting Started with Next.js',
    content: 'Next.js is a popular React framework for building server-side rendered and statically generated web applications. This post covers the basics of setting up a Next.js project and creating your first pages. We will explore routing, data fetching, and component creation. Join us to learn how to leverage the power of Next.js for your next web project.',
    createdAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: '2',
    title: 'Tailwind CSS for Modern UIs',
    content: 'Tailwind CSS is a utility-first CSS framework that allows for rapid UI development. Instead of writing custom CSS, you use pre-defined utility classes directly in your HTML. This approach promotes consistency and speed. This guide will show you how to integrate Tailwind CSS into your projects and build beautiful, responsive interfaces efficiently.',
    createdAt: new Date('2024-01-20T14:30:00Z'),
  },
  {
    id: '3',
    title: 'Understanding Server Components in Next.js 14',
    content: 'Next.js 14 introduces significant enhancements, especially around Server Components. Server Components allow you to write UI that runs on the server, reducing client-side JavaScript and improving performance. This article delves into the architecture, benefits, and practical use cases of Server Components, helping you build faster and more efficient applications.',
    createdAt: new Date('2024-02-01T09:00:00Z'),
  },
];
