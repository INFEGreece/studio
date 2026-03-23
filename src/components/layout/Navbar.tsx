
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Music, BarChart3, Settings, User as UserIcon, LogIn, LogOut, Calendar, Star, History } from 'lucide-react';
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

  const infeEvents = [
    { name: "Eurodromio", icon: <Music className="h-4 w-4" /> },
    { name: "Be.So.", icon: <Star className="h-4 w-4" /> },
    { name: "Mu.Si.Ka.", icon: <Music className="h-4 w-4" /> }
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-20 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-12 w-20">
              <Image src="https://infegreece.com/wp-content/uploads/2023/04/Infe-Greece.jpg" alt="Logo" fill className="object-contain rounded-lg" priority />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-xl font-headline font-black tracking-tighter">INFE <span className="text-primary">GREECE</span></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Official Fan Poll</span>
            </div>
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-5 rounded-full flex items-center gap-2 text-sm font-bold hover:bg-primary/10 hover:text-primary transition-all">
                <Star className="h-4 w-4 text-primary" /> INFE Events
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-2xl p-2" align="start">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">Higher Level Events</DropdownMenuLabel>
              {infeEvents.map(event => (
                <DropdownMenuItem key={event.name} asChild className="rounded-xl h-11 cursor-pointer">
                  <Link href={`/?year=2026&stage=${event.name}`} className="flex items-center gap-3">
                    {event.icon}
                    <span className="font-bold">{event.name}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-5 rounded-full flex items-center gap-2 text-sm font-bold hover:bg-muted/50 transition-all">
                <History className="h-4 w-4" /> Eurovision Archives
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 rounded-2xl p-2" align="start">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">Select Decade</DropdownMenuLabel>
              {DECADES.map(decade => (
                <DropdownMenuSub key={decade.label}>
                  <DropdownMenuSubTrigger className="rounded-xl h-11 cursor-pointer font-bold">{decade.label}</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="max-h-[400px] overflow-y-auto rounded-2xl p-2 shadow-2xl">
                      {decade.years.map(year => (
                        <DropdownMenuItem key={year} asChild className="rounded-xl h-10 cursor-pointer font-medium">
                          <Link href={`/year/${year}/`}>{year}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" asChild className="h-12 px-5 rounded-full font-bold hover:bg-muted/50">
            <Link href="/scoreboard" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Scoreboard</Link>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          )}
          {!user ? (
            <Button variant="default" className="h-11 px-6 rounded-full font-bold shadow-lg shadow-primary/20" onClick={() => setIsAuthOpen(true)}>
              <LogIn className="h-4 w-4 mr-2" /> Sign In
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0 overflow-hidden border-2 border-primary/20">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={`https://picsum.photos/seed/${user.uid}/200`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black">
                      {user.email?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 rounded-2xl p-2 mt-2" align="end">
                <DropdownMenuLabel className="font-bold p-3">My Account</DropdownMenuLabel>
                <DropdownMenuItem asChild className="rounded-xl h-11 cursor-pointer">
                  <Link href="/profile" className="flex items-center gap-3">
                    <UserIcon className="h-4 w-4" /> Profile & Votes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive rounded-xl h-11 cursor-pointer font-bold focus:bg-destructive/10" onClick={() => signOut(auth)}>
                  <LogOut className="h-4 w-4 mr-2" /> Log out
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
