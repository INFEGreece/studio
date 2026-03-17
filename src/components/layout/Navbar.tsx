"use client";

import Link from 'next/link';
import { Trophy, Music, BarChart3, Settings, User } from 'lucide-react';
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

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
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
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src="https://picsum.photos/seed/user1/200" alt="User" />
                  <AvatarFallback>EV</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">EuroFan_2024</p>
                  <p className="text-xs leading-none text-muted-foreground">fan@esc-nights.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
