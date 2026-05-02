
"use client";

import { useState, useEffect, useMemo } from 'react';
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
import { Plus, Pencil, Trash2, Search, Loader2, ShieldAlert, RotateCcw, AlertTriangle, Lock, Unlock, ImageIcon, User, Layers, Star, Music, Youtube, Calendar, Download, FileSpreadsheet, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, collectionGroup, getDocs } from 'firebase/firestore';
import { Entry, ContestStage, YearMetadata, Vote } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getFlagUrl, cn } from '@/lib/utils';
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
  const [isYearEditOpen, setIsYearEditOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  const adminDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);
  
  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminDocRef);
  const isAdmin = !!adminData;

  const yearMetaRef = useMemoFirebase(() => collection(db, 'year_metadata'), [db]);
  const { data: allYearMeta } = useCollection<YearMetadata>(yearMetaRef);

  const [selectedYearMeta, setSelectedYearMeta] = useState<YearMetadata | null>(null);
  const [yearDescription, setYearDescription] = useState("");
  const [yearLogoUrl, setYearLogoUrl] = useState("");
  const [isVotingOpen, setIsVotingOpen] = useState(true);
  const [isScoreboardVisible, setIsScoreboardVisible] = useState(true);

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

  const allPossibleStages = ['Final', 'Semi-Final 1', 'Semi-Final 2', 'Prequalification', 'Eurodromio', 'Be.So.', 'Mu.Si.Ka.'];
  const allYears = useMemo(() => DECADES.flatMap(d => d.years).sort((a, b) => b - a), []);

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    return entries.filter(e => {
      const matchesSearch = 
        e.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.songTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesYear = filterYear === "All" || e.year.toString() === filterYear;
      const matchesStage = filterStage === "All" || e.stage === filterStage;
      
      return matchesSearch && matchesYear && matchesStage;
    }).sort((a, b) => b.year - a.year || a.country.localeCompare(b.country));
  }, [entries, searchTerm, filterYear, filterStage]);

  const openYearEdit = (year: number) => {
    const meta = (allYearMeta || []).find(m => m.id === year.toString());
    setSelectedYearMeta(meta || { id: year.toString(), description: "", isVotingOpen: true, isScoreboardVisible: true, logoUrl: "" });
    setYearDescription(meta?.description || "");
    setIsVotingOpen(meta?.isVotingOpen ?? true);
    setIsScoreboardVisible(meta?.isScoreboardVisible ?? true);
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
      isScoreboardVisible: isScoreboardVisible,
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

  const toggleScoreboardVisibility = (yearId: string, currentStatus: boolean) => {
    const docRef = doc(db, 'year_metadata', yearId);
    setDocumentNonBlocking(docRef, { isScoreboardVisible: !currentStatus }, { merge: true });
    toast({ title: `Το Scoreboard για το ${yearId} είναι πλέον ${!currentStatus ? 'ορατό' : 'κρυφό'}` });
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

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportEntriesCSV = () => {
    if (!entries) return;
    const headers = ["ID", "Year", "Country", "Artist", "Song Title", "Stage", "Video URL", "Bio URL"];
    const rows = entries.map(e => [
      e.id,
      e.year,
      `"${e.country}"`,
      `"${e.artist}"`,
      `"${e.songTitle}"`,
      e.stage,
      e.videoUrl,
      e.bioUrl || ""
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadCSV(csvContent, "eurovision_entries.csv");
    toast({ title: "Εξαγωγή Συμμετοχών Επιτυχής" });
  };

  const exportVotesCSV = async () => {
    setIsExporting(true);
    try {
      const snapshot = await getDocs(query(collectionGroup(db, 'votes')));
      const votesData = snapshot.docs.map(doc => doc.data() as Vote);
      
      const headers = ["Vote ID", "User ID", "Year", "Entry ID", "Country", "Points", "Date", "Feedback"];
      const rows = votesData.map(v => {
        const entry = (entries || []).find(e => e.id === v.eurovisionEntryId);
        return [
          v.id,
          v.userId,
          v.year,
          v.eurovisionEntryId,
          entry ? `"${entry.country}"` : "Unknown",
          v.points,
          v.votedAt,
          v.feedback ? `"${v.feedback.replace(/"/g, '""')}"` : ""
        ];
      });

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      downloadCSV(csvContent, "eurovision_votes.csv");
      toast({ title: "Εξαγωγή Ψήφων Επιτυχής" });
    } catch (error: any) {
      toast({ title: "Σφάλμα Εξαγωγής", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
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

  const slugify = (text: string) => {
    if (!text) return "";
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^\u0370-\u03FF\u1F00-\u1FFF\w\s-]/g, "") // Keep Greek and Alpha
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 8);
  };

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
            <Button className="h-12 rounded-xl" onClick={() => { 
              setIsEditing(false); 
              setCurrentId(null);
              // Use current filterYear for new entry if it's a valid year
              const defaultYear = filterYear !== "All" ? parseInt(filterYear) : 2026;
              const defaultStage = filterStage !== "All" ? filterStage as ContestStage : 'Final';
              
              setFormData({ 
                country: '', 
                flagUrl: '', 
                year: defaultYear, 
                artist: '', 
                songTitle: '', 
                videoUrl: '', 
                thumbnailUrl: '', 
                bioUrl: '', 
                stage: defaultStage
              }); 
              setIsDialogOpen(true); 
            }}>
              <Plus className="h-5 w-5 mr-2" /> Νέα Συμμετοχή
            </Button>
          </div>
        </div>

        <Tabs defaultValue="entries" className="w-full space-y-8">
          <TabsList className="bg-muted/30 p-1 rounded-2xl h-14 flex flex-wrap">
            <TabsTrigger value="entries" className="rounded-xl px-6 h-12 font-bold flex items-center gap-2">
              <Music className="h-4 w-4" /> Συμμετοχές
            </TabsTrigger>
            <TabsTrigger value="years" className="rounded-xl px-6 h-12 font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Έτη
            </TabsTrigger>
            <TabsTrigger value="tools" className="rounded-xl px-6 h-12 font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Εργαλεία & CSV
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="space-y-6">
            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b bg-muted/20 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Αναζήτηση</Label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input className="pl-12 h-12 rounded-xl" placeholder="Χώρα, Καλλιτέχνης ή Τίτλος..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="w-full md:w-48 space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Έτος</Label>
                    <Select value={filterYear} onValueChange={setFilterYear}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Όλα τα Έτη</SelectItem>
                        {allYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full md:w-56 space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Φάση / Event</Label>
                    <Select value={filterStage} onValueChange={setFilterStage}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Όλες οι Φάσεις</SelectItem>
                        {allPossibleStages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl shrink-0" onClick={() => { setSearchTerm(""); setFilterYear("All"); setFilterStage("All"); }}>
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Συμμετοχή</TableHead>
                      <TableHead>Έτος</TableHead>
                      <TableHead>Φάση</TableHead>
                      <TableHead className="text-right">Ενέργειες</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-base">{entry.country}</span>
                            <span className="text-xs text-muted-foreground">{entry.artist} — {entry.songTitle}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{entry.year}</Badge></TableCell>
                        <TableCell><Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">{entry.stage}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2" onClick={() => { setIsEditing(true); setCurrentId(entry.id); setFormData({ ...entry, bioUrl: entry.bioUrl || '', videoUrl: entry.videoUrl || '', thumbnailUrl: entry.thumbnailUrl || '' }); setIsDialogOpen(true); }}><Pencil className="h-4 w-4 mr-2"/> Edit</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if(confirm("Διαγραφή;")) deleteDocumentNonBlocking(doc(db, 'eurovision_entries', entry.id)); }}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredEntries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">Δεν βρέθηκαν συμμετοχές με αυτά τα κριτήρια.</TableCell>
                      </TableRow>
                    )}
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
                    <TableHead>Scoreboard</TableHead>
                    <TableHead>Logo</TableHead>
                    <TableHead className="text-right">Ενέργειες</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allYears.map(year => {
                    const meta = (allYearMeta || []).find(m => m.id === year.toString());
                    const isOpen = meta?.isVotingOpen ?? true;
                    const isSBVisible = meta?.isScoreboardVisible ?? true;
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
                           <div className="flex items-center gap-2">
                            <Switch checked={isSBVisible} onCheckedChange={() => toggleScoreboardVisibility(year.toString(), isSBVisible)} />
                            {isSBVisible ? <Badge variant="secondary"><Eye className="h-3 w-3 mr-1"/> Visible</Badge> : <Badge variant="outline"><EyeOff className="h-3 w-3 mr-1"/> Hidden</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {meta?.logoUrl ? <Badge variant="secondary">Custom</Badge> : <Badge variant="outline">Default</Badge>}
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

          <TabsContent value="tools" className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-card border rounded-[2rem] p-8 space-y-6 shadow-sm">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Download className="h-6 w-6 text-primary" /> Εξαγωγή Δεδομένων
                  </h2>
                  <p className="text-sm text-muted-foreground">Κατεβάστε τα δεδομένα σας σε μορφή CSV για επεξεργασία στο Excel.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button variant="outline" className="h-14 rounded-xl justify-start px-6 font-bold" onClick={exportEntriesCSV}>
                    <Music className="h-5 w-5 mr-3 text-primary" /> Εξαγωγή Συμμετοχών (.csv)
                  </Button>
                  <Button variant="outline" className="h-14 rounded-xl justify-start px-6 font-bold" onClick={exportVotesCSV} disabled={isExporting}>
                    {isExporting ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Star className="h-5 w-5 mr-3 text-primary" />}
                    Εξαγωγή Όλων των Ψήφων (.csv)
                  </Button>
                </div>
              </div>

              <div className="bg-destructive/5 border-2 border-dashed border-destructive/20 rounded-[2rem] p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-destructive flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6" /> Επικίνδυνη Ζώνη
                  </h2>
                  <p className="text-sm text-muted-foreground">Ενέργειες που δεν αντιστρέφονται. Προσοχή!</p>
                </div>
                <div className="pt-4">
                  <Button variant="destructive" className="w-full h-14 rounded-xl font-black shadow-xl shadow-destructive/10" onClick={handleResetAllVotes} disabled={isResetting}>
                    {isResetting ? <Loader2 className="h-6 w-6 animate-spin" /> : <RotateCcw className="h-6 w-6 mr-3" />} ΟΛΙΚΟΣ ΜΗΔΕΝΙΣΜΟΣ ΨΗΦΩΝ
                  </Button>
                </div>
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Ψηφοφορία</Label>
                    <p className="text-[10px] text-muted-foreground">Ανοιχτή/Κλειστή.</p>
                  </div>
                  <Switch checked={isVotingOpen} onCheckedChange={setIsVotingOpen} />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Scoreboard</Label>
                    <p className="text-[10px] text-muted-foreground">Ορατό στους Voters.</p>
                  </div>
                  <Switch checked={isScoreboardVisible} onCheckedChange={setIsScoreboardVisible} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4"/> Logo URL Override</Label>
                <Input value={yearLogoUrl} onChange={(e) => setYearLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="h-12 rounded-xl"/>
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
              // unique ID includes random suffix to prevent collisions
              const id = currentId || `${formData.year}-${slugify(formData.stage)}-${slugify(formData.country)}-${slugify(formData.songTitle)}-${generateRandomId()}`;
              setDocumentNonBlocking(doc(db, 'eurovision_entries', id), { ...formData, id, flagUrl: getFlagUrl(formData.country) }, { merge: true });
              setIsDialogOpen(false);
              toast({ title: isEditing ? "Ενημερώθηκε!" : "Αποθηκεύτηκε!" });
            }} className="w-full h-12 rounded-xl font-bold">Αποθήκευση</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
