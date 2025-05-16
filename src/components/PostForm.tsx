
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
import { createPost } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Send, Bold, Italic, List, ListOrdered, Link2 } from "lucide-react";
import { useTransition, useRef } from "react";

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

export function PostForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const applyFormat = (formatType: "bold" | "italic" | "bullet" | "ordered" | "link") => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    let newText = textarea.value;
    let cursorPos = end;

    switch (formatType) {
      case "bold":
        newText = `${beforeText}**${selectedText || "text"}**${afterText}`;
        cursorPos = start + 2 + (selectedText ? selectedText.length : 4) + 2;
        if (!selectedText) cursorPos = start + 2;
        break;
      case "italic":
        newText = `${beforeText}*${selectedText || "text"}*${afterText}`;
        cursorPos = start + 1 + (selectedText ? selectedText.length : 4) + 1;
        if (!selectedText) cursorPos = start + 1;
        break;
      case "bullet":
        newText = `${beforeText}* ${selectedText || "List item"}\n${afterText}`;
        cursorPos = start + 2 + (selectedText ? selectedText.length : 9);
        break;
      case "ordered":
        newText = `${beforeText}1. ${selectedText || "List item"}\n${afterText}`;
        cursorPos = start + 3 + (selectedText ? selectedText.length : 9);
        break;
      case "link":
        const url = prompt("Enter link URL:", "https://");
        if (url) {
          const linkText = selectedText || "link text";
          newText = `${beforeText}[${linkText}](${url})${afterText}`;
          cursorPos = start + 1 + linkText.length + 3 + url.length + 1;
        }
        break;
    }
    
    form.setValue("content", newText, { shouldValidate: true });
    // Wait for next tick to set focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("content", values.content);

    startTransition(async () => {
      try {
        await createPost(formData);
        toast({
          title: "Post Created!",
          description: "Your new blog post has been successfully created.",
        });
        // Redirection is handled by the server action
      } catch (error) {
        let errorMessage = "Failed to create post.";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  }

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
                  ref={contentRef} // Assign ref here
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
        <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isPending}>
          {isPending ? (
            "Submitting..."
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Post
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
