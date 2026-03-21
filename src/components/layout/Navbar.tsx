
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Music, BarChart3, Settings, User as UserIcon, LogIn, LogOut, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { useState } from 'react';
import { DECADES } from '@/lib/data';

export function Navbar() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const adminDocRef = useMemoFirebase(() => user ? doc(db, 'roles_admin', user.uid) : null, [db, user]);
  const { data: adminData } = useDoc(adminDocRef);
  const isAdmin = !!adminData;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-16">
              <Image src="https://infegreece.com/wp-content/uploads/2023/04/Infe-Greece.jpg" alt="Logo" fill className="object-contain rounded" priority />
            </div>
            <span className="text-xl font-headline font-bold hidden sm:inline-block">INFE <span className="text-primary">GR Poll</span></span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" /> Έτη & Διαγωνισμοί
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl" align="start">
              {DECADES.map(decade => (
                <DropdownMenuSub key={decade.label}>
                  <DropdownMenuSubTrigger>{decade.label}</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto rounded-xl">
                      {decade.years.map(year => (
                        <DropdownMenuItem key={year} asChild>
                          <Link href={`/year/${year}/`}>{year}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Link href="/scoreboard" className="flex items-center gap-2 text-sm font-medium hover:text-primary"><BarChart3 className="h-4 w-4" /> Scoreboard</Link>
        </div>

        <div className="flex items-center gap-4">
          {isAdmin && <Link href="/admin"><Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button></Link>}
          {!user ? (
            <Button variant="default" size="sm" onClick={() => setIsAuthOpen(true)}><LogIn className="h-4 w-4 mr-2" /> Sign In</Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9"><AvatarImage src={`https://picsum.photos/seed/${user.uid}/200`} /><AvatarFallback>EV</AvatarFallback></Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem asChild><Link href="/profile">My Profile</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => signOut(auth)}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <AuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </nav>
  );
}
