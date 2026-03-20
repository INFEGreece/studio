
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Vote } from '@/lib/types';
import { Loader2, User as UserIcon, Calendar, Trophy, History, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const userVotesRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'users', user.uid, 'votes'),
      orderBy('votedAt', 'desc')
    );
  }, [db, user]);

  const { data: votes, isLoading: isVotesLoading } = useCollection<Vote>(userVotesRef);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6 bg-card border rounded-[2rem] p-10 shadow-xl">
            <UserIcon className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
            <h1 className="text-3xl font-headline font-bold">Παρακαλώ Συνδεθείτε</h1>
            <p className="text-muted-foreground">Πρέπει να είστε συνδεδεμένοι για να δείτε το προφίλ σας και το ιστορικό των ψήφων σας.</p>
            <Button asChild className="w-full rounded-xl h-12">
              <Link href="/">Επιστροφή στην Αρχική</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container px-4 py-8 md:py-16 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-6">
            <Card className="rounded-[2rem] border-2 overflow-hidden shadow-lg">
              <div className="h-24 bg-primary/10 w-full" />
              <div className="px-8 pb-8 pt-0 -mt-12 flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                  <AvatarImage src={`https://picsum.photos/seed/${user.uid}/200`} />
                  <AvatarFallback className="text-2xl">{user.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="mt-4 space-y-1">
                  <h2 className="text-2xl font-headline font-bold">{user.displayName || 'EuroFan'}</h2>
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </div>
                </div>
                <div className="grid grid-cols-2 w-full gap-4 mt-8">
                  <div className="bg-muted/50 p-4 rounded-2xl">
                    <p className="text-2xl font-bold text-primary">{votes?.length || 0}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ψήφοι</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-2xl">
                    <p className="text-2xl font-bold text-accent">{votes?.reduce((sum, v) => sum + v.points, 0) || 0}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Πόντοι</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="p-6 bg-secondary/20 rounded-[2rem] border border-secondary/30 space-y-4 shadow-sm">
              <h3 className="font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Κατάσταση Λογαριασμού
              </h3>
              <p className="text-sm text-muted-foreground">
                Ο λογαριασμός σας είναι ενεργός. Οι ψήφοι σας αποθηκεύονται με ασφάλεια και συμβάλλουν στο παγκόσμιο scoreboard.
              </p>
              <div className="pt-2">
                <Badge variant="outline" className="bg-background border-primary/30 text-primary">Official Fan Member</Badge>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl md:text-4xl font-headline font-bold flex items-center gap-3">
                <History className="h-8 w-8 text-primary" />
                Ιστορικό Ψηφοφορίας
              </h1>
            </div>

            {isVotesLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : !votes || votes.length === 0 ? (
              <Card className="rounded-[2rem] border-dashed border-2 bg-muted/10">
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <Calendar className="h-12 w-12 text-muted-foreground opacity-30" />
                  <p className="text-xl font-bold text-muted-foreground">Δεν έχουν βρεθεί ψήφοι</p>
                  <Button asChild variant="outline" className="rounded-xl h-12 px-8">
                    <Link href="/">Ξεκινήστε την Ψηφοφορία</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {votes.map((vote) => (
                  <Card key={vote.id} className="rounded-2xl border hover:border-primary/30 transition-all group shadow-sm">
                    <div className="p-4 md:p-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Trophy className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{vote.points} Πόντοι</span>
                            <Badge variant="secondary" className="text-[10px] font-bold">{vote.year}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate italic">
                            {vote.feedback || "Χωρίς σχόλιο"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(vote.votedAt).toLocaleDateString()}
                        </span>
                        <Button variant="ghost" size="sm" asChild className="h-8 rounded-lg group-hover:text-primary">
                          <Link href={`/?year=${vote.year}`}>
                            Δείτε το Έτος <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
