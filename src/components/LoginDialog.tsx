
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/authActions";
import { useToast } from "@/hooks/use-toast";
import { User, Eye, EyeOff } from "lucide-react"; // Changed LogIn to User
import { useRouter } from "next/navigation";

export function LoginDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    startTransition(async () => {
      const result = await login(formData);
      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Welcome back, admin!",
        });
        setIsOpen(false);
        setUsername("");
        setPassword("");
        setShowPassword(false); // Reset password visibility on successful login
        // router.refresh() is handled by revalidatePath in the server action
      } else {
        setError(result.error || "An unknown error occurred.");
        toast({
          title: "Login Failed",
          description: result.error || "Please check your credentials.",
          variant: "destructive",
        });
      }
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) { // Reset form on dialog close
        setUsername("");
        setPassword("");
        setShowPassword(false);
        setError(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <User className="mr-2 h-4 w-4" /> Login {/* Changed LogIn to User */}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Admin Login</DialogTitle>
          <DialogDescription>
            Enter your admin credentials to access restricted features.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username-login" className="text-right">
                Username
              </Label>
              <Input
                id="username-login"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="col-span-3"
                disabled={isPending}
                required
                autoComplete="username"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password-login" className="text-right">
                Password
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="password-login"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10" // Add padding to the right for the icon
                  disabled={isPending}
                  required
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isPending}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {error && (
              <p className="col-span-4 text-center text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Logging in..." : "Login"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
