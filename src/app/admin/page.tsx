
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Search, Loader2, ShieldAlert, BookOpen, RotateCcw, AlertTriangle, Lock, Unlock, ImageIcon, User, Layers, Star, Music, Youtube, Calendar, CheckCircle2, XCircle } from 'lucide-react';
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
  const [isYearEditOpen, setIsYearEditOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  const adminDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);
  
  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminDocRef);
  const isAdmin = !!adminData;

  // Year Metadata Collection
  const yearMetaRef = useMemoFirebase(() => collection(db, 'year_metadata'), [db]);
  const { data: allYearMeta } = useCollection<YearMetadata>(yearMetaRef);

  // For Year Edit Dialog
  const [selectedYearMeta, setSelectedYearMeta] = useState<YearMetadata | null>(null);
  const [yearDescription, setYearDescription] = useState("");
  const [yearLogoUrl, setYearLogoUrl] = useState("");
  const [isVotingOpen, setIsVotingOpen] = useState(true);

  const configRef = useMemoFirebase(() => doc(db, 'settings', 'menu_config'), [db]);
  const { data: menuConfig } = useDoc<any>(configRef);
  const [highLevelStages, setHighLevelStages] = useState<string[]>([]);

  useEffect(() => {
    if (menuConfig && menuConfig.highLevelStages) {
      setHighLevelStages(menuConfig.highLevelStages);
    } else {
      setHighLevelStages(['Eurodromio', 'Be.So.', 'Mu.Si.Ka.']);
    }
  }, [menuConfig]);

  const [formData, setFormData] = useState({
    country: '',
    flagUrl: '',
    year: 2026,
    artist: '',
    songTitle: '',
    videoUrl: '',
    thumbnailUrl: '',
    bioUrl: '',
    stage: 'Final' as ContestStage
  });

  const entriesRef = useMemoFirebase(() => collection(db, 'eurovision_entries'), [db]);
  const { data: entries } = useCollection<Entry>(entriesRef);

  const allYears = DECADES.flatMap(d => d.years).sort((a, b) => b - a);

  const openYearEdit = (year: number) => {
    const meta = (allYearMeta || []).find(m => m.id === year.toString());
    setSelectedYearMeta(meta || { id: year.toString(), description: "", isVotingOpen: true, logoUrl: "" });
    setYearDescription(meta?.description || "");
    setIsVotingOpen(meta?.isVotingOpen ?? true);
    setYearLogoUrl(meta?.logoUrl || "");
    setIsYearEditOpen(true);
  };

  const handleSaveYearInfo = () => {
    if (!selectedYearMeta) return;
    const docRef = doc(db, 'year_metadata', selectedYearMeta.id);
    setDocumentNonBlocking(docRef, {
      id: selectedYearMeta.id,
      description: yearDescription,
      isVotingOpen: isVotingOpen,
      logoUrl: yearLogoUrl
    }, { merge: true });
    toast({ title: `Πληροφορίες ${selectedYearMeta.id} Αποθηκεύτηκαν` });
    setIsYearEditOpen(false);
  };

  const toggleYearVoting = (yearId: string, currentStatus: boolean) => {
    const docRef = doc(db, 'year_metadata', yearId);
    setDocumentNonBlocking(docRef, { isVotingOpen: !currentStatus }, { merge: true });
    toast({ title: `Η ψηφοφορία για το ${yearId} ${!currentStatus ? 'άνοιξε' : 'έκλεισε'}` });
  };

  const handleSaveCategories = () => {
    setDocumentNonBlocking(configRef, { highLevelStages }, { merge: true });
    toast({ title: "Οι κατηγορίες μενού ενημερώθηκαν!" });
    setIsCategoriesOpen(false);
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
          <p className="text-muted-foreground text-sm">Πρέπει να έχετε δικαιώματα διαχειριστή για να δείτε αυτή τη σελίδα.</p>
          <Button variant="outline" className="w-full" asChild><Link href="/">Επιστροφή</Link></Button>
        </div>
      </main>
    </div>
  );

  const allPossibleStages = ['Final', 'Semi-Final 1', 'Semi-Final 2', 'Prequalification', 'Eurodromio', 'Be.So.', 'Mu.Si.Ka.'];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Διαχείριση</h1>
            <p className="text-muted-foreground">Συμμετοχές, Έτη & Έλεγχος Ψηφοφορίας.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-12 rounded-xl" onClick={() => setIsCategoriesOpen(true)}>
              <Layers className="h-5 w-5 mr-2" /> Κατηγορίες Μενού
            </Button>
            <Button className="h-12 rounded-xl" onClick={() => { setIsEditing(false); setFormData({ country: '', flagUrl: '', year: 2026, artist: '', songTitle: '', videoUrl: '', thumbnailUrl: '', bioUrl: '', stage: 'Final' }); setIsDialogOpen(true); }}>
              <Plus className="h-5 w-5 mr-2" /> Νέα Συμμετοχή
            </Button>
          </div>
        </div>

        <Tabs defaultValue="entries" className="w-full space-y-8">
          <TabsList className="bg-muted/30 p-1 rounded-2xl h-14">
            <TabsTrigger value="entries" className="rounded-xl px-8 h-12 font-bold flex items-center gap-2">
              <Music className="h-4 w-4" /> Συμμετοχές
            </TabsTrigger>
            <TabsTrigger value="years" className="rounded-xl px-8 h-12 font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Έλεγχος Ετών
            </TabsTrigger>
            <TabsTrigger value="danger" className="rounded-xl px-8 h-12 font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Συντήρηση
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="space-y-6">
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
                          <Button variant="outline" size="sm" className="mr-2" onClick={() => { setIsEditing(true); setCurrentId(entry.id); setFormData({ ...entry, bioUrl: entry.bioUrl || '', videoUrl: entry.videoUrl || '', thumbnailUrl: entry.thumbnailUrl || '' }); setIsDialogOpen(true); }}><Pencil className="h-4 w-4 mr-2"/> Επεξεργασία</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if(confirm("Διαγραφή;")) deleteDocumentNonBlocking(doc(db, 'eurovision_entries', entry.id)); }}>Διαγραφή</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="years" className="space-y-6">
            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Έτος</TableHead>
                    <TableHead>Ψηφοφορία</TableHead>
                    <TableHead>Περιγραφή / Logo</TableHead>
                    <TableHead className="text-right">Ενέργειες</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allYears.map(year => {
                    const meta = (allYearMeta || []).find(m => m.id === year.toString());
                    const isOpen = meta?.isVotingOpen ?? true;
                    return (
                      <TableRow key={year}>
                        <TableCell className="font-black text-lg">{year}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch checked={isOpen} onCheckedChange={() => toggleYearVoting(year.toString(), isOpen)} />
                            {isOpen ? <Badge className="bg-green-500"><Unlock className="h-3 w-3 mr-1"/> Ανοιχτή</Badge> : <Badge variant="destructive"><Lock className="h-3 w-3 mr-1"/> Κλειστή</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {meta?.description ? <Badge variant="secondary">Ναι</Badge> : <Badge variant="outline">Όχι</Badge>}
                          {meta?.logoUrl ? <Badge variant="secondary" className="ml-2">Custom Logo</Badge> : null}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openYearEdit(year)}>
                            <Pencil className="h-4 w-4 mr-2" /> Επεξεργασία
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="danger" className="space-y-6">
            <div className="p-8 rounded-[2rem] bg-destructive/5 border-2 border-dashed border-destructive/20 flex flex-col items-center text-center space-y-6">
              <AlertTriangle className="h-16 w-16 text-destructive" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-destructive">Ολικός Μηδενισμός Ψήφων</h2>
                <p className="text-muted-foreground max-w-md">Αυτή η ενέργεια θα διαγράψει ΟΡΙΣΤΙΚΑ όλες τις ψήφους από όλα τα έτη και όλους τους χρήστες. Δεν υπάρχει επιστροφή.</p>
              </div>
              <Button variant="destructive" size="lg" className="h-14 px-10 rounded-2xl font-black shadow-xl shadow-destructive/20" onClick={handleResetAllVotes} disabled={isResetting}>
                {isResetting ? <Loader2 className="h-6 w-6 animate-spin" /> : <RotateCcw className="h-6 w-6 mr-3" />} ΕΚΤΕΛΕΣΗ ΜΗΔΕΝΙΣΜΟΥ
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Categories Dialog */}
        <Dialog open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-8">
            <DialogHeader><DialogTitle className="text-2xl font-headline font-bold">Κατηγοριοποίηση Events</DialogTitle></DialogHeader>
            <div className="space-y-6 py-4">
               <p className="text-sm text-muted-foreground">Επιλέξτε ποιες φάσεις/events θα εμφανίζονται στην ενότητα "Higher Level Events" του μενού.</p>
               <div className="space-y-3">
                  {allPossibleStages.map(stage => (
                    <div key={stage} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border">
                      <div className="flex items-center gap-3">
                        <Star className={`h-4 w-4 ${highLevelStages.includes(stage) ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-bold">{stage}</span>
                      </div>
                      <Switch 
                        checked={highLevelStages.includes(stage)} 
                        onCheckedChange={(checked) => {
                          if (checked) setHighLevelStages([...highLevelStages, stage]);
                          else setHighLevelStages(highLevelStages.filter(s => s !== stage));
                        }} 
                      />
                    </div>
                  ))}
               </div>
            </div>
            <DialogFooter><Button onClick={handleSaveCategories} className="w-full h-12 rounded-xl font-bold">Αποθήκευση Μενού</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Year Edit Dialog */}
        <Dialog open={isYearEditOpen} onOpenChange={setIsYearEditOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[2rem] p-8">
            <DialogHeader><DialogTitle className="text-2xl font-headline font-bold">Επεξεργασία Έτους {selectedYearMeta?.id}</DialogTitle></DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border">
                <div className="space-y-0.5">
                  <Label className="text-base">Κατάσταση Ψηφοφορίας</Label>
                  <p className="text-sm text-muted-foreground">Ενεργοποίηση ή απενεργοποίηση για όλους.</p>
                </div>
                <Switch checked={isVotingOpen} onCheckedChange={setIsVotingOpen} />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4"/> Logo URL Override</Label>
                <Input value={yearLogoUrl} onChange={(e) => setYearLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="h-12 rounded-xl"/>
                <p className="text-[10px] text-muted-foreground">Αφήστε το κενό για να χρησιμοποιηθεί το αυτόματο logo του φακέλου /assets/logos/.</p>
              </div>

              <div className="space-y-2">
                <Label>Περιγραφή Έτους</Label>
                <Textarea className="min-h-[150px] rounded-xl" value={yearDescription} onChange={(e) => setYearDescription(e.target.value)} />
              </div>
            </div>
            <DialogFooter><Button onClick={handleSaveYearInfo} className="w-full h-12 rounded-xl font-bold">Αποθήκευση</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Entry Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[2rem] p-8 overflow-y-auto max-h-[90vh]">
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
              
              <div className="space-y-2"><Label className="flex items-center gap-2"><Youtube className="h-4 w-4 text-red-500" /> Video URL</Label><Input value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} placeholder="https://www.youtube.com/..." className="rounded-xl h-11" /></div>
              <div className="space-y-2"><Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Thumbnail / Image URL</Label><Input value={formData.thumbnailUrl} onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })} placeholder="https://example.com/image.jpg" className="rounded-xl h-11" /></div>
              <div className="space-y-2"><Label className="flex items-center gap-2"><User className="h-4 w-4" /> Artist Bio URL (infegreece.com)</Label><Input value={formData.bioUrl} onChange={(e) => setFormData({ ...formData, bioUrl: e.target.value })} placeholder="https://infegreece.com/bio-slug" className="rounded-xl h-11" /></div>
              
              <div className="space-y-2"><Label>Φάση</Label>
                <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v as ContestStage })}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{allPossibleStages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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
