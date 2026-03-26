
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Music, BarChart3, Settings, User as UserIcon, LogIn, LogOut, Calendar, Star, History, Sparkles, HelpCircle, CheckCircle2, RotateCcw, Share2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { useState, useEffect } from 'react';
import { DECADES } from '@/lib/data';

export function Navbar() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const adminDocRef = useMemoFirebase(() => user ? doc(db, 'roles_admin', user.uid) : null, [db, user]);
  const { data: adminData } = useDoc(adminDocRef);
  const isAdmin = !!adminData;

  const configRef = useMemoFirebase(() => doc(db, 'settings', 'menu_config'), [db]);
  const { data: menuConfig } = useDoc<any>(configRef);
  const [highLevelStages, setHighLevelStages] = useState<string[]>(['Eurodromio', 'Be.So.', 'Mu.Si.Ka.']);

  useEffect(() => {
    if (menuConfig && menuConfig.highLevelStages) {
      setHighLevelStages(menuConfig.highLevelStages);
    }
  }, [menuConfig]);

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
          {/* Voting Guide Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="h-12 px-5 rounded-full flex items-center gap-2 text-sm font-bold hover:bg-primary/10 hover:text-primary transition-all">
                <HelpCircle className="h-4 w-4 text-primary" /> Οδηγός Ψηφοφορίας
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-3">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  Οδηγός & FAQ
                </DialogTitle>
                <DialogDescription>
                  Μάθετε πώς να συμμετάσχετε στο μεγαλύτερο Eurovision Poll της Ελλάδας.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-8 py-6">
                <div className="space-y-3">
                  <h4 className="font-bold flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-4 w-4" /> Πώς μπορώ να ψηφίσω;
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2 pl-6 border-l-2 border-primary/20">
                    <p>1. Συνδεθείτε στο λογαριασμό σας (ή μέσω Google) από το κουμπί <strong>Sign In</strong>.</p>
                    <p>2. Περιηγηθείτε στις συμμετοχές του έτους που σας ενδιαφέρει.</p>
                    <p>3. Πατήστε <strong>"Ψηφίστε Τώρα"</strong> στην κάρτα του τραγουδιού.</p>
                    <p>4. Επιλέξτε τη βαθμολογία σας (1-8, 10 ή 12 πόντους). Κάθε βαθμολογία δίνεται μόνο μία φορά ανά έτος.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold flex items-center gap-2 text-primary">
                    <RotateCcw className="h-4 w-4" /> Μπορώ να αλλάξω την ψήφο μου;
                  </h4>
                  <div className="text-sm text-muted-foreground pl-6 border-l-2 border-primary/20">
                    <p>Ναι! Εάν θέλετε να "ελευθερώσετε" πόντους, επιλέξτε ξανά τη χώρα που είχατε ψηφίσει και επιλέξτε <strong>"0 Πόντοι (Αφαίρεση Ψήφου)"</strong>. Η προηγούμενη βαθμολογία σας θα διαγραφεί και θα μπορείτε να τη χρησιμοποιήσετε σε άλλη συμμετοχή.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold flex items-center gap-2 text-primary">
                    <Share2 className="h-4 w-4" /> Πώς μοιράζομαι το Top 10 μου;
                  </h4>
                  <div className="text-sm text-muted-foreground pl-6 border-l-2 border-primary/20">
                    <p>Όταν συμπληρώσετε τη δεκάδα σας, θα εμφανιστεί η επιλογή <strong>"Κοινοποίηση Top 10"</strong> στην αρχική σελίδα. Από εκεί μπορείτε να κατεβάσετε μια εικόνα (PNG) με το Top 10 σας, έτοιμη για τα Social Media!</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-5 rounded-full flex items-center gap-2 text-sm font-bold hover:bg-primary/10 hover:text-primary transition-all">
                <Sparkles className="h-4 w-4 text-primary" /> INFE Events
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-2xl p-2" align="start">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">Higher Level Events</DropdownMenuLabel>
              {highLevelStages.map(event => (
                <DropdownMenuItem key={event} asChild className="rounded-xl h-11 cursor-pointer">
                  <Link href={`/?year=2026&stage=${event}`} className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="font-bold">{event}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              {highLevelStages.length === 0 && (
                <div className="p-3 text-xs text-muted-foreground italic">Δεν υπάρχουν ενεργά events.</div>
              )}
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
