
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, Search, Loader2, ListPlus, ShieldAlert, Copy, Image as ImageIcon, Filter, RotateCcw, AlertTriangle, BookOpen } from 'lucide-react';
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
  const [filterYear, setFilterYear] = useState<string>("All");
  const [filterStage, setFilterStage] = useState<string>("All");

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

  const [bulkText, setBulkText] = useState("");
  const [bulkYear, setBulkYear] = useState(2026);
  const [bulkStage, setBulkStage] = useState<ContestStage>('Final');

  const [selectedYearMeta, setSelectedYearMeta] = useState("2026");
  const [yearDescription, setYearDescription] = useState("");

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
  const { data: currentYearMeta, isLoading: isYearMetaLoading } = useDoc<YearMetadata>(yearMetaRef);

  useEffect(() => {
    if (currentYearMeta) {
      setYearDescription(currentYearMeta.description || "");
    } else {
      setYearDescription("");
    }
  }, [currentYearMeta]);

  const allYears = DECADES.flatMap(d => d.years).sort((a, b) => b - a);

  const filtered = (entries || [])
    .filter(e => {
      const matchesSearch = 
        e.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.songTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesYear = filterYear === "All" || e.year.toString() === filterYear;
      const matchesStage = filterStage === "All" || e.stage === filterStage;

      return matchesSearch && matchesYear && matchesStage;
    })
    .sort((a, b) => b.year - a.year || a.country.localeCompare(b.country));

  const handleSaveYearInfo = () => {
    const docRef = doc(db, 'year_metadata', selectedYearMeta);
    setDocumentNonBlocking(docRef, {
      id: selectedYearMeta,
      description: yearDescription
    }, { merge: true });
    toast({ title: "Πληροφορίες Έτους Αποθηκεύτηκαν", description: `Ενημερώθηκε η περιγραφή για το ${selectedYearMeta}.` });
    setIsYearInfoOpen(false);
  };

  const handleResetAllVotes = async () => {
    if (!isAdmin) return;
    const confirmText = "ΠΡΟΣΟΧΗ: Αυτή η ενέργεια θα διαγράψει ΟΡΙΣΤΙΚΑ ΟΛΕΣ τις ψήφους όλων των χρηστών. Είστε σίγουροι;";
    if (!confirm(confirmText)) return;
    setIsResetting(true);
    try {
      const votesQuery = query(collectionGroup(db, 'votes'));
      const snapshot = await getDocs(votesQuery);
      if (snapshot.empty) {
        toast({ title: "Δεν βρέθηκαν ψήφοι" });
        setIsResetting(false);
        return;
      }
      snapshot.docs.forEach((vDoc) => deleteDocumentNonBlocking(vDoc.ref));
      toast({ title: "Επιτυχής Μηδενισμός", description: `Διαγράφηκαν ${snapshot.size} εγγραφές.` });
    } catch (error: any) {
      toast({ title: "Σφάλμα Μηδενισμού", description: error.message, variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

  if (isUserLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6 bg-card border rounded-[2rem] p-10 shadow-xl">
            <ShieldAlert className="h-16 w-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-headline font-bold">Άρνηση Πρόσβασης</h1>
            <p className="text-muted-foreground">Χρειάζεστε προνόμια διαχειριστή.</p>
            <div className="p-4 bg-muted/50 rounded-xl text-left font-mono text-xs break-all">
              UID: {user?.uid}
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">Επιστροφή</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (confirm("Οριστική διαγραφή;")) {
      deleteDocumentNonBlocking(doc(db, 'eurovision_entries', id));
      toast({ title: "Διαγράφηκε", variant: "destructive" });
    }
  };

  const openAddDialog = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      country: '', flagUrl: '', year: 2026, artist: '', songTitle: '', videoUrl: '', thumbnailUrl: '', stage: 'Final'
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (entry: Entry) => {
    setIsEditing(true);
    setCurrentId(entry.id);
    setFormData({
      country: entry.country, flagUrl: entry.flagUrl || '', year: entry.year, artist: entry.artist, songTitle: entry.songTitle, videoUrl: entry.videoUrl, thumbnailUrl: entry.thumbnailUrl || '', stage: entry.stage
    });
    setIsDialogOpen(true);
  };

  const handleSaveEntry = () => {
    const stageSlug = formData.stage.toLowerCase().replace(/\s+/g, '-');
    const countrySlug = formData.country.toLowerCase().replace(/\s+/g, '-');
    const songSlug = formData.songTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = currentId || `${formData.year}-${stageSlug}-${countrySlug}-${songSlug}`;
    const docRef = doc(db, 'eurovision_entries', id);
    setDocumentNonBlocking(docRef, { ...formData, id, flagUrl: formData.flagUrl || getFlagUrl(formData.country) }, { merge: true });
    setIsDialogOpen(false);
    toast({ title: isEditing ? "Ενημερώθηκε" : "Δημιουργήθηκε" });
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n');
    lines.forEach(line => {
      const parts = line.split(';').map(p => p.trim());
      if (parts.length >= 3) {
        const [country, artist, song, videoUrl] = parts;
        const stageSlug = bulkStage.toLowerCase().replace(/\s+/g, '-');
        const countrySlug = country.toLowerCase().replace(/\s+/g, '-');
        const songSlug = song.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const id = `${bulkYear}-${stageSlug}-${countrySlug}-${songSlug}`;
        setDocumentNonBlocking(doc(db, 'eurovision_entries', id), {
          id, country, artist, songTitle: song, videoUrl: videoUrl || '', year: bulkYear, stage: bulkStage, flagUrl: getFlagUrl(country),
        }, { merge: true });
      }
    });
    setBulkText("");
    setIsBulkOpen(false);
    toast({ title: "Εισαγωγή Ολοκληρώθηκε" });
  };

  const stages: ContestStage[] = ['Final', 'Semi-Final 1', 'Semi-Final 2', 'Prequalification', 'Eurodromio', 'Be.So.', 'Mu.Si.Ka.'];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container px-4 py-8 md:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">Διαχείριση</h1>
            <p className="text-muted-foreground">Διαχειριστείτε συμμετοχές και περιγραφές ετών.</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none h-12 rounded-xl" onClick={() => setIsYearInfoOpen(true)}>
              <BookOpen className="h-5 w-5 mr-2" /> Πληροφορίες Έτους
            </Button>
            <Button variant="outline" className="flex-1 md:flex-none h-12 rounded-xl" onClick={() => setIsBulkOpen(true)}>
              <ListPlus className="h-5 w-5 mr-2" /> Μαζική
            </Button>
            <Button className="flex-1 md:flex-none h-12 rounded-xl" onClick={openAddDialog}>
              <Plus className="h-5 w-5 mr-2" /> Νέα Συμμετοχή
            </Button>
          </div>
        </div>

        {/* Maintenance */}
        <div className="mb-12 p-6 rounded-2xl bg-destructive/5 border-2 border-dashed border-destructive/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <h2 className="text-lg font-bold text-destructive">Μηδενισμός Ψήφων</h2>
              <p className="text-sm text-muted-foreground">Διαγραφή όλων των ψήφων για όλα τα έτη.</p>
            </div>
          </div>
          <Button variant="destructive" className="w-full md:w-auto h-12 rounded-xl font-bold" onClick={handleResetAllVotes} disabled={isResetting}>
            {isResetting ? <Loader2 className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5 mr-2" />} Ολικός Μηδενισμός
          </Button>
        </div>

        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b bg-muted/20 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input className="pl-12 h-12 rounded-xl bg-background" placeholder="Αναζήτηση..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="h-12 rounded-xl bg-background"><SelectValue placeholder="Έτος" /></SelectTrigger>
              <SelectContent>{allYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="h-12 rounded-xl bg-background"><SelectValue placeholder="Φάση" /></SelectTrigger>
              <SelectContent>{stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Χώρα</TableHead>
                  <TableHead className="font-bold">Τίτλος</TableHead>
                  <TableHead className="font-bold">Καλλιτέχνης</TableHead>
                  <TableHead className="font-bold">Έτος</TableHead>
                  <TableHead className="text-right font-bold">Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-bold">
                      <div className="flex items-center gap-3">
                        <img src={entry.flagUrl || getFlagUrl(entry.country)} alt="" className="h-5 w-8 object-cover rounded shadow-sm" />
                        {entry.country}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground italic">{entry.songTitle}</TableCell>
                    <TableCell>{entry.artist}</TableCell>
                    <TableCell><Badge variant="outline">{entry.year}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-9 px-3 rounded-lg" onClick={() => openEditDialog(entry)}>
                          <Pencil className="h-4 w-4 mr-1" /> Επεξεργασία
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Year Info Editor Dialog */}
        <Dialog open={isYearInfoOpen} onOpenChange={setIsYearInfoOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[2rem] p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold">Πληροφορίες Έτους</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Επιλέξτε Έτος</Label>
                <Select value={selectedYearMeta} onValueChange={setSelectedYearMeta}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Περιγραφή / Infos</Label>
                <Textarea 
                  className="min-h-[200px] rounded-xl"
                  placeholder="Γράψτε μερικά λόγια για το έτος αυτό..."
                  value={yearDescription}
                  onChange={(e) => setYearDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveYearInfo} className="w-full h-12 rounded-xl font-bold">Αποθήκευση Περιγραφής</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Entry Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[2rem] overflow-y-auto max-h-[95vh] p-8">
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
              <div className="space-y-2"><Label>Φάση / Event</Label>
                <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v as ContestStage })}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Video URL</Label><Input value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} className="rounded-xl h-11" /></div>
            </div>
            <DialogFooter><Button onClick={handleSaveEntry} className="w-full h-12 rounded-xl font-bold">Αποθήκευση</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Dialog */}
        <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[2rem] p-8">
            <DialogHeader><DialogTitle>Μαζική Εισαγωγή</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Έτος</Label><Input type="number" value={bulkYear} onChange={(e) => setBulkYear(parseInt(e.target.value))} className="h-11 rounded-xl" /></div>
                <div className="space-y-2"><Label>Φάση</Label>
                  <Select value={bulkStage} onValueChange={(v) => setBulkStage(v as ContestStage)}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea placeholder="Χώρα; Καλλιτέχνης; Τίτλος; VideoUrl" className="min-h-[200px] rounded-xl" value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
            </div>
            <DialogFooter><Button onClick={handleBulkImport} className="w-full h-12 rounded-xl font-bold">Εισαγωγή</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
