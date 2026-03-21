
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, Loader2, ListPlus, ShieldAlert, BookOpen, RotateCcw, AlertTriangle, Lock, Unlock, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, collectionGroup, getDocs } from 'firebase/firestore';
import { Entry, ContestStage, YearMetadata } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getFlagUrl } from '@/lib/utils';
import { DECADES } from '@/lib/data';
import Link from 'next/link';

export default function AdminPage() {
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isYearInfoOpen, setIsYearInfoOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  const adminDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);
  
  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminDocRef);
  const isAdmin = !!adminData;

  const [selectedYearMeta, setSelectedYearMeta] = useState("2026");
  const [yearDescription, setYearDescription] = useState("");
  const [yearLogoUrl, setYearLogoUrl] = useState("");
  const [isVotingOpen, setIsVotingOpen] = useState(true);

  const [formData, setFormData] = useState({
    country: '',
    flagUrl: '',
    year: 2026,
    artist: '',
    songTitle: '',
    videoUrl: '',
    thumbnailUrl: '',
    stage: 'Final' as ContestStage
  });

  const entriesRef = useMemoFirebase(() => collection(db, 'eurovision_entries'), [db]);
  const { data: entries } = useCollection<Entry>(entriesRef);

  const yearMetaRef = useMemoFirebase(() => doc(db, 'year_metadata', selectedYearMeta), [db, selectedYearMeta]);
  const { data: currentYearMeta } = useDoc<YearMetadata>(yearMetaRef);

  useEffect(() => {
    if (currentYearMeta) {
      setYearDescription(currentYearMeta.description || "");
      setIsVotingOpen(currentYearMeta.isVotingOpen ?? true);
      setYearLogoUrl(currentYearMeta.logoUrl || "");
    } else {
      setYearDescription("");
      setIsVotingOpen(true);
      setYearLogoUrl("");
    }
  }, [currentYearMeta]);

  const allYears = DECADES.flatMap(d => d.years).sort((a, b) => b - a);

  const handleSaveYearInfo = () => {
    const docRef = doc(db, 'year_metadata', selectedYearMeta);
    setDocumentNonBlocking(docRef, {
      id: selectedYearMeta,
      description: yearDescription,
      isVotingOpen: isVotingOpen,
      logoUrl: yearLogoUrl
    }, { merge: true });
    toast({ title: "Πληροφορίες Έτους Αποθηκεύτηκαν" });
    setIsYearInfoOpen(false);
  };

  const handleResetAllVotes = async () => {
    if (!isAdmin) return;
    if (!confirm("ΠΡΟΣΟΧΗ: Αυτή η ενέργεια θα διαγράψει ΟΡΙΣΤΙΚΑ ΟΛΕΣ τις ψήφους. Είστε σίγουροι;")) return;
    setIsResetting(true);
    try {
      const snapshot = await getDocs(query(collectionGroup(db, 'votes')));
      snapshot.docs.forEach((vDoc) => deleteDocumentNonBlocking(vDoc.ref));
      toast({ title: "Επιτυχής Μηδενισμός" });
    } catch (error: any) {
      toast({ title: "Σφάλμα Μηδενισμού", description: error.message, variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

  if (isUserLoading || isAdminLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  if (!user || !isAdmin) return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container flex items-center justify-center p-4 text-center">
        <div className="max-w-md space-y-6 bg-card border rounded-[2rem] p-10 shadow-xl">
          <ShieldAlert className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-headline font-bold">Άρνηση Πρόσβασης</h1>
          <Button variant="outline" className="w-full" asChild><Link href="/">Επιστροφή</Link></Button>
        </div>
      </main>
    </div>
  );

  const stages: ContestStage[] = ['Final', 'Semi-Final 1', 'Semi-Final 2', 'Prequalification', 'Eurodromio', 'Be.So.', 'Mu.Si.Ka.'];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Διαχείριση</h1>
            <p className="text-muted-foreground">Συμμετοχές, Πληροφορίες & Έλεγχος Ψηφοφορίας.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-12 rounded-xl" onClick={() => setIsYearInfoOpen(true)}>
              <BookOpen className="h-5 w-5 mr-2" /> Πληροφορίες & Voting
            </Button>
            <Button className="h-12 rounded-xl" onClick={() => { setIsEditing(false); setFormData({ country: '', flagUrl: '', year: 2026, artist: '', songTitle: '', videoUrl: '', thumbnailUrl: '', stage: 'Final' }); setIsDialogOpen(true); }}>
              <Plus className="h-5 w-5 mr-2" /> Νέα Συμμετοχή
            </Button>
          </div>
        </div>

        <div className="mb-12 p-6 rounded-2xl bg-destructive/5 border-2 border-dashed border-destructive/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div><h2 className="text-lg font-bold text-destructive">Μηδενισμός Ψήφων</h2><p className="text-sm text-muted-foreground">Διαγραφή όλων των ψήφων παγκοσμίως.</p></div>
          </div>
          <Button variant="destructive" className="h-12 rounded-xl font-bold" onClick={handleResetAllVotes} disabled={isResetting}>
            {isResetting ? <Loader2 className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5 mr-2" />} Ολικός Μηδενισμός
          </Button>
        </div>

        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b bg-muted/20">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input className="pl-12 h-12 rounded-xl" placeholder="Αναζήτηση χώρας..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Χώρα</TableHead><TableHead>Τίτλος</TableHead><TableHead>Έτος</TableHead><TableHead className="text-right">Ενέργειες</TableHead></TableRow></TableHeader>
              <TableBody>
                {(entries || []).filter(e => e.country.toLowerCase().includes(searchTerm.toLowerCase())).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-bold">{entry.country}</TableCell>
                    <TableCell>{entry.songTitle}</TableCell>
                    <TableCell><Badge variant="outline">{entry.year}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="mr-2" onClick={() => { setIsEditing(true); setCurrentId(entry.id); setFormData(entry); setIsDialogOpen(true); }}><Pencil className="h-4 w-4 mr-2"/> Επεξεργασία</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if(confirm("Διαγραφή;")) deleteDocumentNonBlocking(doc(db, 'eurovision_entries', entry.id)); }}>Διαγραφή</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={isYearInfoOpen} onOpenChange={setIsYearInfoOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[2rem] p-8">
            <DialogHeader><DialogTitle className="text-2xl font-headline font-bold">Πληροφορίες & Logo Έτους</DialogTitle></DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Έτος</Label>
                  <Select value={selectedYearMeta} onValueChange={setSelectedYearMeta}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{allYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col justify-center space-y-2">
                  <Label>Ψηφοφορία Ενεργή;</Label>
                  <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl h-12">
                    <Switch checked={isVotingOpen} onCheckedChange={setIsVotingOpen} />
                    {isVotingOpen ? <Unlock className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4 text-destructive" />}
                    <span className="text-sm font-bold">{isVotingOpen ? "Ανοιχτή" : "Κλειστή"}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4"/> Logo URL (Custom)</Label>
                <Input value={yearLogoUrl} onChange={(e) => setYearLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="h-12 rounded-xl"/>
                <p className="text-[10px] text-muted-foreground">Αν μείνει κενό, θα αναζητηθεί αυτόματα στον φάκελο /assets/logos/</p>
              </div>

              <div className="space-y-2">
                <Label>Περιγραφή Έτους</Label>
                <Textarea className="min-h-[150px] rounded-xl" value={yearDescription} onChange={(e) => setYearDescription(e.target.value)} />
              </div>
            </div>
            <DialogFooter><Button onClick={handleSaveYearInfo} className="w-full h-12 rounded-xl font-bold">Αποθήκευση</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[2rem] p-8">
            <DialogHeader><DialogTitle>{isEditing ? "Επεξεργασία" : "Νέα Συμμετοχή"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Χώρα</Label><Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="rounded-xl h-11" /></div>
                <div className="space-y-2"><Label>Έτος</Label><Input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="rounded-xl h-11" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Καλλιτέχνης</Label><Input value={formData.artist} onChange={(e) => setFormData({ ...formData, artist: e.target.value })} className="rounded-xl h-11" /></div>
                <div className="space-y-2"><Label>Τίτλος</Label><Input value={formData.songTitle} onChange={(e) => setFormData({ ...formData, songTitle: e.target.value })} className="rounded-xl h-11" /></div>
              </div>
              <div className="space-y-2"><Label>Video URL</Label><Input value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} className="rounded-xl h-11" /></div>
              <div className="space-y-2"><Label>Φάση</Label>
                <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v as ContestStage })}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={() => {
              const id = currentId || `${formData.year}-${formData.stage.toLowerCase()}-${formData.country.toLowerCase().replace(/\s+/g, '-')}`;
              setDocumentNonBlocking(doc(db, 'eurovision_entries', id), { ...formData, id, flagUrl: getFlagUrl(formData.country) }, { merge: true });
              setIsDialogOpen(false);
            }} className="w-full h-12 rounded-xl font-bold">Αποθήκευση</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
