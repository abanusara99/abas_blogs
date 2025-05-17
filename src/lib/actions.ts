
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Post } from "@/types";
import { db } from "./db";
import { getCurrentAdmin } from "./authActions"; // Import auth function

export async function getPosts(): Promise<Post[]> {
  const stmt = db.prepare('SELECT * FROM posts ORDER BY createdAt DESC');
  // Ensure that the data from the DB is correctly typed, especially dates
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
  title: z.string().min(3, "Title must be at least 3 characters long.").max(100, "Title must not exceed 100 characters."),
  content: z.string().min(10, "Content must be at least 10 characters long.").max(5000, "Content must not exceed 5000 characters."),
});

export async function createPost(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error("Unauthorized: You must be logged in as an admin to create posts.");
  }

  const validatedFields = PostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const errorMessages = Object.values(fieldErrors).flat().join('; ') || validatedFields.error.flatten().formErrors.join('; ');
    console.error("Validation failed for createPost:", fieldErrors);
    throw new Error(`Validation failed: ${errorMessages}`);
  }

  const { title, content } = validatedFields.data;
  const newPostId = String(Date.now()); 
  const createdAt = new Date().toISOString();

  try {
    const stmt = db.prepare('INSERT INTO posts (id, title, content, createdAt) VALUES (?, ?, ?, ?)');
    stmt.run(newPostId, title, content, createdAt);
  } catch (dbError: any) {
    console.error("Database error in createPost:", dbError);
    throw new Error(`A database error occurred while creating the post: ${dbError.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/posts/${newPostId}`);
  redirect(`/posts/${newPostId}`); 
}

export async function updatePost(id: string, formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error("Unauthorized: You must be logged in as an admin to update posts.");
  }

  const validatedFields = PostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const errorMessages = Object.values(fieldErrors).flat().join('; ') || validatedFields.error.flatten().formErrors.join('; ');
    console.error("Validation failed for updatePost:", fieldErrors);
    throw new Error(`Validation failed: ${errorMessages}`);
  }

  const { title, content } = validatedFields.data;

  try {
    const stmt = db.prepare('UPDATE posts SET title = ?, content = ? WHERE id = ?');
    const result = stmt.run(title, content, id);

    if (result.changes === 0) {
      throw new Error("Post not found or no changes made.");
    }
  } catch (dbError: any) {
    console.error("Database error in updatePost:", dbError);
    throw new Error(`A database error occurred while updating the post: ${dbError.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/posts/${id}`);
  redirect(`/posts/${id}`); 
}


export async function deletePost(id: string): Promise<{ success: boolean; message?: string }> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { success: false, message: "Unauthorized: You must be logged in as an admin to delete posts." };
  }

  try {
    const stmt = db.prepare('DELETE FROM posts WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return { success: false, message: "Post not found." };
    }

    revalidatePath("/");
    // Note: revalidatePath(`/posts/${id}`) might be needed if you could go back to a cached deleted page
    return { success: true };
  } catch (dbError: any) {
    console.error("Database error in deletePost:", dbError);
    return { success: false, message: "A database error occurred while deleting the post. Check server console for details." };
  }
}
