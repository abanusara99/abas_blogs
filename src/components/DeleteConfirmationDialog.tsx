
"use client";

import type { Post } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deletePost } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from 'next/navigation'; // Changed from 'next/redirect'

interface DeleteConfirmationDialogProps {
  post: Post;
  onDeleted?: () => void;
}

export function DeleteConfirmationDialog({ post, onDeleted }: DeleteConfirmationDialogProps) {
  const { toast } = useToast();
  const router = useRouter(); // Use Next.js router for client-side navigation
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deletePost(post.id);
        if (result.success) {
          toast({
            title: "Post Deleted",
            description: `"${post.title}" has been successfully deleted.`,
          });
          setIsOpen(false);
          if (onDeleted) {
            onDeleted();
          } else {
            // If onDeleted is not provided, it might be on the post detail page.
            // Redirect to home after deletion using client-side router.
            router.push('/');
            router.refresh(); // Refresh server components on the target page
          }
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to delete the post.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Delete post">
          <Trash2 className="h-5 w-5 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the post titled
            <strong className="mx-1">"{post.title}"</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-blue-700 hover:bg-blue-800 text-white"
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
