
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
import { Loader2, Mail, Lock, User, UserPlus, LogIn, Chrome, AlertCircle } from 'lucide-react';

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
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      if (!auth) throw new Error("Auth service is not initialized.");
      
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        toast({ title: "Welcome!", description: "Signed in successfully with Google." });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      
      let errorMessage = "Failed to sign in. Please try again.";
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "Error: This domain (infepoll.infegreece.com) is not authorized in Firebase Console > Auth > Settings.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup blocked! Please enable popups for this site.";
      }

      toast({
        title: "Sign-In Error",
        description: errorMessage,
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
        toast({ title: "Account Created", description: "Welcome to the fan poll!" });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome Back!", description: "Successfully signed in." });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Invalid credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-[2.5rem] p-10 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-3xl font-headline font-bold text-center flex items-center justify-center gap-4">
            {isSignUp ? <UserPlus className="h-8 w-8 text-primary" /> : <LogIn className="h-8 w-8 text-primary" />}
            {isSignUp ? 'Join In' : 'Sign In'}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {isSignUp 
              ? 'Save your Eurovision votes forever.' 
              : 'Welcome back to the poll!'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          <Button 
            variant="outline" 
            className="w-full h-16 border-2 font-bold hover:bg-muted text-lg rounded-2xl flex items-center justify-center gap-4" 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Chrome className="h-6 w-6 text-primary" />}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]">
              <span className="bg-background px-6 text-muted-foreground">Or email</span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest ml-1">Name</Label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="name" 
                    placeholder="Your name" 
                    className="pl-12 h-14 bg-muted/20 border-muted/50 rounded-2xl"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest ml-1">Email</Label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="email@example.com" 
                  className="pl-12 h-14 bg-muted/20 border-muted/50 rounded-2xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest ml-1">Password</Label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-12 h-14 bg-muted/20 border-muted/50 rounded-2xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-16 text-xl bg-primary hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20" disabled={isLoading}>
              {isLoading && <Loader2 className="h-5 w-5 animate-spin mr-3" />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-muted-foreground pt-4">
              {isSignUp ? 'Already a member?' : "New here?"}{' '}
              <button 
                type="button" 
                className="text-primary font-bold hover:underline"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Log in' : 'Join for free'}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
