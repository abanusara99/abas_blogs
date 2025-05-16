"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Post } from "@/types";
import { posts as postsData } from "./data"; // Modifiable posts array

// Helper to simulate database latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getPosts(): Promise<Post[]> {
  await delay(100); // Simulate network delay
  return postsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getPostById(id: string): Promise<Post | undefined> {
  await delay(50);
  return postsData.find((post) => post.id === id);
}

const PostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  content: z.string().min(10, "Content must be at least 10 characters long."),
});

export async function createPost(formData: FormData) {
  const validatedFields = PostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!validatedFields.success) {
    // This error handling is basic. In a real app, you'd return structured errors.
    console.error("Validation failed:", validatedFields.error.flatten().fieldErrors);
    throw new Error("Validation failed. Please check your input.");
  }

  const { title, content } = validatedFields.data;

  const newPost: Post = {
    id: String(Date.now()), // Simple ID generation
    title,
    content,
    createdAt: new Date(),
  };

  await delay(200);
  postsData.unshift(newPost); // Add to the beginning of the array

  revalidatePath("/");
  revalidatePath(`/posts/${newPost.id}`);
  redirect("/"); // Redirect to home page after creation
}

export async function deletePost(id: string): Promise<{ success: boolean; message?: string }> {
  await delay(200);
  const postIndex = postsData.findIndex((post) => post.id === id);
  if (postIndex === -1) {
    return { success: false, message: "Post not found." };
  }

  postsData.splice(postIndex, 1);
  revalidatePath("/");
  // Potentially revalidate individual post paths if they were cached,
  // but since it's deleted, revalidating home is most important.
  return { success: true };
}
