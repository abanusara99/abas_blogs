"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Post } from "@/types";
import { db } from "./db"; // Import the SQLite database instance

export async function getPosts(): Promise<Post[]> {
  const stmt = db.prepare('SELECT * FROM posts ORDER BY createdAt DESC');
  const dbPosts = stmt.all() as Omit<Post, 'createdAt'> & { createdAt: string }[];
  return dbPosts.map(post => ({
    ...post,
    createdAt: new Date(post.createdAt),
  }));
}

export async function getPostById(id: string): Promise<Post | undefined> {
  const stmt = db.prepare('SELECT * FROM posts WHERE id = ?');
  const dbPost = stmt.get(id) as Omit<Post, 'createdAt'> & { createdAt: string } | undefined;
  if (!dbPost) {
    return undefined;
  }
  return {
    ...dbPost,
    createdAt: new Date(dbPost.createdAt),
  };
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
    console.error("Validation failed:", validatedFields.error.flatten().fieldErrors);
    throw new Error("Validation failed. Please check your input.");
  }

  const { title, content } = validatedFields.data;
  const newPostId = String(Date.now()); // Simple ID generation
  const createdAt = new Date().toISOString();

  const stmt = db.prepare('INSERT INTO posts (id, title, content, createdAt) VALUES (?, ?, ?, ?)');
  stmt.run(newPostId, title, content, createdAt);

  revalidatePath("/");
  revalidatePath(`/posts/${newPostId}`);
  redirect("/"); 
}

export async function deletePost(id: string): Promise<{ success: boolean; message?: string }> {
  const stmt = db.prepare('DELETE FROM posts WHERE id = ?');
  const result = stmt.run(id);

  if (result.changes === 0) {
    return { success: false, message: "Post not found." };
  }

  revalidatePath("/");
  return { success: true };
}
