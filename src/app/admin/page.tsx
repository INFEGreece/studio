
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
import { Plus, Pencil, Trash2, Search, Loader2, ListPlus, ShieldAlert, Copy, Image as ImageIcon, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Entry, ContestStage } from '@/lib/types';
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
  const [isEditing, setIsEditing] = useState(false);
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
  const { data: entries, isLoading: isEntriesLoading } = useCollection<Entry>(entriesRef);

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

  const copyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      toast({ title: "UID Αντιγράφηκε", description: "Μπορείτε τώρα να το προσθέσετε στη συλλογή roles_admin." });
    }
  };

  if (isUserLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (!isAdmin && !isAdminLoading)) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6 md:space-y-8 bg-card border rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 shadow-2xl">
            <div className="bg-destructive/10 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8 md:h-10 md:w-10 text-destructive" />
            </div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-foreground">Άρνηση Πρόσβασης</h1>
            <p className="text-sm md:text-base text-muted-foreground">Χρειάζεστε προνόμια διαχειριστή για να διαχειριστείτε τη βάση δεδομένων.</p>
            
            {user && (
              <div className="p-4 md:p-6 bg-muted/50 rounded-2xl text-left space-y-4">
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Το UID του λογαριασμού σας:</p>
                <div className="flex items-center gap-2 md:gap-3 bg-background border p-2 md:p-3 rounded-xl text-[10px] md:text-xs font-mono break-all group relative">
                  <span className="flex-1 overflow-hidden truncate">{user.uid}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-primary/10 hover:text-primary" onClick={copyUid}>
                    <Copy className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed italic">
                    1. Αντιγράψτε το UID παραπάνω.
                    2. Μεταβείτε στο Firebase Console &rarr; Firestore Database.
                    3. Δημιουργήστε συλλογή roles_admin.
                    4. Προσθέστε έγγραφο με Document ID το UID σας.
                  </p>
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full h-11 md:h-12 rounded-xl" asChild>
              <Link href="/">Επιστροφή στην Αρχική</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (confirm("Οριστική διαγραφή αυτής της συμμετοχής;")) {
      const docRef = doc(db, 'eurovision_entries', id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: "Η συμμετοχή διαγράφηκε", variant: "destructive" });
    }
  };

  const openAddDialog = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      country: '',
      flagUrl: '',
      year: 2026,
      artist: '',
      songTitle: '',
      videoUrl: '',
      thumbnailUrl: '',
      stage: 'Final'
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (entry: Entry) => {
    setIsEditing(true);
    setCurrentId(entry.id);
    setFormData({
      country: entry.country,
      flagUrl: entry.flagUrl || '',
      year: entry.year,
      artist: entry.artist,
      songTitle: entry.songTitle,
      videoUrl: entry.videoUrl,
      thumbnailUrl: entry.thumbnailUrl || '',
      stage: entry.stage
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.country || !formData.artist || !formData.songTitle) {
      toast({ title: "Σφάλμα", description: "Χώρα, Καλλιτέχνης και Τίτλος Τραγουδιού είναι απαραίτητα.", variant: "destructive" });
      return;
    }

    const stageSlug = formData.stage.toLowerCase().replace(/\s+/g, '-');
    const countrySlug = formData.country.toLowerCase().replace(/\s+/g, '-');
    const songSlug = formData.songTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const id = currentId || `${formData.year}-${stageSlug}-${countrySlug}-${songSlug}`;
    const docRef = doc(db, 'eurovision_entries', id);
    
    setDocumentNonBlocking(docRef, {
      ...formData,
      id,
      flagUrl: formData.flagUrl || getFlagUrl(formData.country)
    }, { merge: true });

    setIsDialogOpen(false);
    toast({ title: isEditing ? "Η συμμετοχή ενημερώθηκε" : "Η συμμετοχή δημιουργήθηκε" });
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
        const docRef = doc(db, 'eurovision_entries', id);
        
        setDocumentNonBlocking(docRef, {
          id,
          country,
          artist,
          songTitle: song,
          videoUrl: videoUrl || '',
          year: bulkYear,
          stage: bulkStage,
          flagUrl: getFlagUrl(country),
        }, { merge: true });
      }
    });
    setBulkText("");
    setIsBulkOpen(false);
    toast({ title: "Η μαζική εισαγωγή ολοκληρώθηκε" });
  };

  const stages: ContestStage[] = ['Final', 'Semi-Final 1', 'Semi-Final 2', 'Prequalification', 'Eurodromio', 'Be.So.', 'Mu.Si.Ka.'];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container px-4 py-8 md:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">Διαχείριση Διαγωνισμού</h1>
            <p className="text-muted-foreground mt-1 text-base md:text-lg">Διαχειριστείτε συμμετοχές για όλα τα έτη και τις εκδηλώσεις.</p>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none h-11 md:h-12 px-4 md:px-6 rounded-xl" onClick={() => setIsBulkOpen(true)}>
              <ListPlus className="h-5 w-5 mr-2" /> <span className="hidden sm:inline">Μαζική</span> Εισαγωγή
            </Button>
            <Button className="flex-1 md:flex-none h-11 md:h-12 px-4 md:px-6 rounded-xl bg-primary hover:bg-primary/90" onClick={openAddDialog}>
              <Plus className="h-5 w-5 mr-2" /> Νέα Συμμετοχή
            </Button>
          </div>
        </div>

        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 md:p-6 border-b bg-muted/20 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              <Filter className="h-3 w-3" /> Φίλτρα
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <Input 
                  className="pl-10 md:pl-11 h-11 md:h-12 rounded-xl bg-background border-muted/50" 
                  placeholder="Αναζήτηση χώρας ή καλλιτέχνη..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
              
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="h-11 md:h-12 rounded-xl bg-background border-muted/50">
                  <SelectValue placeholder="Όλα τα έτη" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Όλα τα έτη</SelectItem>
                  {allYears.map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStage} onValueChange={setFilterStage}>
                <SelectTrigger className="h-11 md:h-12 rounded-xl bg-background border-muted/50">
                  <SelectValue placeholder="Όλες οι φάσεις" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Όλες οι φάσεις / Events</SelectItem>
                  {stages.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold py-4 whitespace-nowrap">Χώρα</TableHead>
                  <TableHead className="font-bold py-4 whitespace-nowrap">Τίτλος</TableHead>
                  <TableHead className="font-bold py-4 whitespace-nowrap">Καλλιτέχνης</TableHead>
                  <TableHead className="font-bold py-4 whitespace-nowrap">Έτος</TableHead>
                  <TableHead className="font-bold py-4 whitespace-nowrap">Φάση / Event</TableHead>
                  <TableHead className="text-right font-bold py-4 whitespace-nowrap">Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id} className="group transition-colors">
                    <TableCell className="font-bold flex items-center gap-3 whitespace-nowrap">
                      <Link href={`/country/${encodeURIComponent(entry.country)}`} className="flex items-center gap-3 group/link hover:text-primary transition-colors underline-offset-4 hover:underline">
                        <img src={entry.flagUrl || getFlagUrl(entry.country)} alt="" className="h-4 w-6 md:h-5 md:w-8 object-cover rounded shadow-sm shrink-0" />
                        {entry.country}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground italic font-medium whitespace-nowrap">{entry.songTitle}</TableCell>
                    <TableCell className="whitespace-nowrap">{entry.artist}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold">{entry.year}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary" className="text-[9px] md:text-[10px]">{entry.stage}</Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1 md:gap-2">
                        <Button variant="ghost" size="icon" className="hover:text-primary transition-colors h-8 w-8" onClick={() => openEditDialog(entry)}>
                          <Pencil className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:text-destructive transition-colors h-8 w-8" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[1.5rem] md:rounded-[2rem] overflow-y-auto max-h-[95vh] p-6 md:p-8">
            <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl font-headline font-bold">
                {isEditing ? "Επεξεργασία" : "Νέα Συμμετοχή"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:gap-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Χώρα</Label>
                  <Input id="country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Έτος</Label>
                  <Input id="year" type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="rounded-xl h-11" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="artist">Καλλιτέχνης</Label>
                  <Input id="artist" value={formData.artist} onChange={(e) => setFormData({ ...formData, artist: e.target.value })} className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="songTitle">Τίτλος Τραγουδιού</Label>
                  <Input id="songTitle" value={formData.songTitle} onChange={(e) => setFormData({ ...formData, songTitle: e.target.value })} className="rounded-xl h-11" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Φάση / Event</Label>
                <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v as ContestStage })}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL (YouTube)</Label>
                <Input id="videoUrl" placeholder="https://www.youtube.com/watch?v=..." value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} className="rounded-xl h-11" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> Φωτογραφία Καλλιτέχνη
                  </Label>
                  <Input id="thumbnailUrl" placeholder="URL εικόνας" value={formData.thumbnailUrl} onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })} className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flagUrl" className="flex items-center gap-2">
                    Σημαία (Προαιρετικά)
                  </Label>
                  <Input id="flagUrl" placeholder="Custom URL σημαίας" value={formData.flagUrl} onChange={(e) => setFormData({ ...formData, flagUrl: e.target.value })} className="rounded-xl h-11" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="w-full h-12 md:h-14 rounded-xl text-lg font-bold">Αποθήκευση</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8">
            <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl font-headline font-bold">Μαζική Εισαγωγή</DialogTitle>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">Επικολλήστε γραμμές: Χώρα; Καλλιτέχνης; Τραγούδι; VideoUrl</p>
            </DialogHeader>
            <div className="space-y-4 md:space-y-6 py-4 md:py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Έτος</Label>
                  <Input type="number" value={bulkYear} onChange={(e) => setBulkYear(parseInt(e.target.value))} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Φάση / Event</Label>
                  <Select value={bulkStage} onValueChange={(v) => setBulkStage(v as ContestStage)}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea 
                placeholder="Ελλάδα; Μαρίνα Σάττι; Zari; https://youtu.be/..."
                className="min-h-[200px] md:min-h-[250px] font-mono text-[10px] md:text-xs rounded-xl p-3 md:p-4 bg-muted/20 border-muted/50"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleBulkImport} className="w-full h-12 md:h-14 rounded-xl text-lg font-bold">Εισαγωγή Τώρα</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
