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
import { Send } from "lucide-react";
import { useTransition } from "react";

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

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
        // router.push('/'); // No longer needed here if server action redirects
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
              <FormControl>
                <Textarea
                  placeholder="Write your blog post content here..."
                  {...field}
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
