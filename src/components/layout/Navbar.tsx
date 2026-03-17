"use client";

import Link from 'next/link';
import { Trophy, Music, BarChart3, Settings, User as UserIcon, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { useState } from 'react';

export function Navbar() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Check if current user is an admin
  const adminDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);
  
  const { data: adminData } = useDoc(adminDocRef);
  const isAdmin = !!adminData;

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/20">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-headline font-bold tracking-tight text-foreground hidden sm:inline-block">
              INFE <span className="text-primary">GR Poll</span>
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            <Music className="h-4 w-4" />
            Entries
          </Link>
          <Link href="/scoreboard" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            <BarChart3 className="h-4 w-4" />
            Scoreboard
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          )}
          
          {!user ? (
            <Button 
              variant="default" 
              size="sm" 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsAuthOpen(true)}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarImage src={`https://picsum.photos/seed/${user.uid}/200`} alt="User" />
                    <AvatarFallback>{user.email?.substring(0, 2).toUpperCase() || 'EV'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName || user.email?.split('@')[0] || 'EuroFan'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user.email || 'Anonymous User'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <AuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </nav>
  );
}