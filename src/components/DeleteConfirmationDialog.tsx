
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
import { useState, useTransition } from "react";
import { useRouter } from 'next/navigation';

interface DeleteConfirmationDialogProps {
  post: Post;
  onDeleted?: () => void;
}

export function DeleteConfirmationDialog({ post, onDeleted }: DeleteConfirmationDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
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
            router.push('/');
            router.refresh(); 
          }
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to delete the post.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error during post deletion:", error); // Log the actual error to the console
        let errorMessage = "An unexpected error occurred. Check the console for details.";
        if (error instanceof Error && error.message) {
          // Use the error message if available, otherwise use the generic one
          errorMessage = error.message;
        }
        toast({
          title: "Deletion Failed",
          description: errorMessage,
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
