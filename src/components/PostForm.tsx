
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPost, updatePost } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Send, Bold, Italic, List, ListOrdered, Link2, XCircle, Save } from "lucide-react"; // Added Save icon
import { useTransition, useRef, useEffect } from "react";
import type { Post } from "@/types";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }).max(100, {
    message: "Title must not exceed 100 characters."
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }).max(5000, {
    message: "Content must not exceed 5000 characters."
  }),
});

interface PostFormProps {
  post?: Post; // Optional post for editing
}

export function PostForm({ post }: PostFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: post?.title || "",
      content: post?.content || "",
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        content: post.content,
      });
    }
  }, [post, form]);

  const applyFormat = (formatType: "bold" | "italic" | "bullet" | "ordered" | "link") => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const currentVal = textarea.value;
    const selStart = textarea.selectionStart;
    const selEnd = textarea.selectionEnd;
    const selectedText = currentVal.substring(selStart, selEnd);
    const beforeText = currentVal.substring(0, selStart);
    const afterText = currentVal.substring(selEnd);

    let newText = currentVal;
    let newSelStart = selStart;
    let newSelEnd = selEnd;

    switch (formatType) {
      case "bold":
        const boldPlaceholder = "text";
        if (selectedText) {
          newText = `${beforeText}**${selectedText}**${afterText}`;
          newSelStart = selStart + 2 + selectedText.length + 2; 
          newSelEnd = newSelStart;
        } else {
          newText = `${beforeText}**${boldPlaceholder}**${afterText}`;
          newSelStart = selStart + 2; 
          newSelEnd = newSelStart + boldPlaceholder.length;
        }
        break;
      case "italic":
        const italicPlaceholder = "text";
        if (selectedText) {
          newText = `${beforeText}*${selectedText}*${afterText}`;
          newSelStart = selStart + 1 + selectedText.length + 1; 
          newSelEnd = newSelStart;
        } else {
          newText = `${beforeText}*${italicPlaceholder}*${afterText}`;
          newSelStart = selStart + 1; 
          newSelEnd = newSelStart + italicPlaceholder.length;
        }
        break;
      case "bullet":
        const bulletPlaceholder = "List item";
        if (selectedText) {
          newText = `${beforeText}* ${selectedText}${selectedText.endsWith('\\n') ? '' : '\\n'}${afterText}`;
          newSelStart = selStart + `* ${selectedText}${selectedText.endsWith('\\n') ? '' : '\\n'}`.length;
          newSelEnd = newSelStart;
        } else {
          newText = `${beforeText}* ${bulletPlaceholder}\\n${afterText}`;
          newSelStart = selStart + 2; 
          newSelEnd = newSelStart + bulletPlaceholder.length;
        }
        break;
      case "ordered":
        const orderedPlaceholder = "List item";
        if (selectedText) {
          newText = `${beforeText}1. ${selectedText}${selectedText.endsWith('\\n') ? '' : '\\n'}${afterText}`;
          newSelStart = selStart + `1. ${selectedText}${selectedText.endsWith('\\n') ? '' : '\\n'}`.length;
          newSelEnd = newSelStart;
        } else {
          newText = `${beforeText}1. ${orderedPlaceholder}\\n${afterText}`;
          newSelStart = selStart + 3; 
          newSelEnd = newSelStart + orderedPlaceholder.length;
        }
        break;
      case "link":
        const url = prompt("Enter link URL:", "https://");
        if (url) {
          const linkTextPlaceholder = "link text";
          const actualLinkText = selectedText || linkTextPlaceholder;
          newText = `${beforeText}[${actualLinkText}](${url})${afterText}`;
          if (selectedText) {
            newSelStart = selStart + `[${actualLinkText}](${url})`.length; 
            newSelEnd = newSelStart;
          } else {
            newSelStart = selStart + 1; 
            newSelEnd = newSelStart + linkTextPlaceholder.length;
          }
        } else {
          return; 
        }
        break;
    }
    
    form.setValue("content", newText, { shouldDirty: true, shouldTouch: true, shouldValidate: false });
    
    requestAnimationFrame(() => {
      if (contentRef.current) {
        contentRef.current.focus();
        contentRef.current.setSelectionRange(newSelStart, newSelEnd);
      }
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("content", values.content);

    startTransition(async () => {
      try {
        if (post?.id) {
          await updatePost(post.id, formData);
          // On success, updatePost will redirect. A success toast can be shown on the target page.
        } else {
          await createPost(formData);
          // On success, createPost will redirect. A success toast can be shown on the target page.
        }
      } catch (error: any) { // Catch errors thrown by the server actions
        toast({
          title: "Operation Failed",
          description: error.message || (post?.id ? "Failed to update post." : "Failed to create post."),
          variant: "destructive",
        });
      }
    });
  }

  const isEditing = !!post?.id;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter post title" {...field} className="text-base" />
              </FormControl>
              <FormDescription>
                A catchy title for your blog post.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Content</FormLabel>
              <div className="flex space-x-1 mb-2 border border-input rounded-md p-1">
                <Button type="button" variant="outline" size="icon" onClick={() => applyFormat("bold")} title="Bold">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => applyFormat("italic")} title="Italic">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => applyFormat("bullet")} title="Bullet List">
                  <List className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => applyFormat("ordered")} title="Numbered List">
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => applyFormat("link")} title="Add Link">
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
              <FormControl>
                <Textarea
                  placeholder="Write your blog post content here..."
                  {...field}
                  ref={contentRef} 
                  className="min-h-[200px] text-base"
                />
              </FormControl>
              <FormDescription>
                The main content of your blog post. Supports markdown.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex space-x-2">
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isPending}>
            {isPending ? (
              isEditing ? "Updating..." : "Submitting..."
            ) : (
              <>
                {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                {isEditing ? "Update Post" : "Submit Post"}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => router.push(isEditing ? `/posts/${post.id}` : '/')}
            disabled={isPending}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
