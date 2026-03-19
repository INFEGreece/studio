"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, UserPlus, LogIn, Chrome } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const auth = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Welcome!", description: "Signed in with Google successfully." });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Google Sign-In Error",
        description: error.message || "Failed to sign in with Google. Check if your domain is authorized in Firebase Console.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        toast({ title: "Account Created", description: "Welcome to the INFE GR Eurovision Poll!" });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome Back!", description: "Successfully signed in." });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to sign in. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl p-8">
        <DialogHeader>
          <DialogTitle className="text-3xl font-headline font-bold text-center flex items-center justify-center gap-3">
            {isSignUp ? <UserPlus className="h-8 w-8 text-primary" /> : <LogIn className="h-8 w-8 text-primary" />}
            {isSignUp ? 'Join Us' : 'Welcome Back'}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {isSignUp 
              ? 'Join the community and celebrate Eurovision history.' 
              : 'Sign in to access your votes and live rankings.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Button 
            variant="outline" 
            className="w-full h-14 border-2 font-bold hover:bg-muted text-lg rounded-xl" 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Chrome className="h-5 w-5 mr-3 text-primary" />}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-[0.2em]">
              <span className="bg-background px-4 text-muted-foreground">OR</span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider ml-1">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    placeholder="Enter your name" 
                    className="pl-11 h-12 bg-muted/20 border-muted/50 focus:border-primary rounded-xl"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider ml-1">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  className="pl-11 h-12 bg-muted/20 border-muted/50 focus:border-primary rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider ml-1">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-11 h-12 bg-muted/20 border-muted/50 focus:border-primary rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-14 text-xl bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : null}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-muted-foreground pt-4">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                type="button" 
                className="text-primary font-bold hover:underline transition-all"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Sign In Now' : 'Join for Free'}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
