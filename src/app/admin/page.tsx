"use client";

import { useState } from 'react';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, Loader2, Image as ImageIcon, ListPlus, ShieldAlert, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Entry, ContestStage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getFlagUrl } from '@/lib/utils';
import Link from 'next/link';

export default function AdminPage() {
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
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

  const filtered = (entries || [])
    .filter(e => 
      e.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.songTitle.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.country.localeCompare(b.country));

  const copyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      toast({ title: "UID Copied", description: "Now add this as a Document ID in your roles_admin collection." });
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
          <div className="max-w-md w-full text-center space-y-8 bg-card border rounded-[2rem] p-10 shadow-2xl">
            <div className="bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-headline font-bold">Access Denied</h1>
            <p className="text-muted-foreground">You need administrator privileges to manage the Eurovision database.</p>
            
            {user && (
              <div className="p-6 bg-muted/50 rounded-2xl text-left space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Account UID:</p>
                <div className="flex items-center gap-3 bg-background border p-3 rounded-xl text-sm font-mono break-all group relative">
                  {user.uid}
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-primary/10 hover:text-primary" onClick={copyUid}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    1. Copy this UID above.<br/>
                    2. Go to Firebase Console -> Firestore.<br/>
                    3. Add a collection named <strong>roles_admin</strong>.<br/>
                    4. Create a document with the **Document ID** as your UID.
                  </p>
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full h-12 rounded-xl" asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (confirm("Remove this entry permanently?")) {
      const docRef = doc(db, 'eurovision_entries', id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: "Entry Removed", variant: "destructive" });
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

  const handleSave = () => {
    if (!formData.country || !formData.artist || !formData.songTitle) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
      return;
    }

    const stageSlug = formData.stage.toLowerCase().replace(/\s+/g, '-');
    const id = currentId || `${formData.year}-${stageSlug}-${formData.country.toLowerCase().replace(/\s+/g, '-')}`;
    const docRef = doc(db, 'eurovision_entries', id);
    
    setDocumentNonBlocking(docRef, {
      ...formData,
      id,
      totalPoints: 0,
      voteCount: 0
    }, { merge: true });

    setIsDialogOpen(false);
    toast({ title: "Database Updated" });
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n');
    lines.forEach(line => {
      const parts = line.split(';').map(p => p.trim());
      if (parts.length >= 3) {
        const [country, artist, song, videoUrl] = parts;
        const stageSlug = bulkStage.toLowerCase().replace(/\s+/g, '-');
        const id = `${bulkYear}-${stageSlug}-${country.toLowerCase().replace(/\s+/g, '-')}`;
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
          totalPoints: 0,
          voteCount: 0
        }, { merge: true });
      }
    });
    setBulkText("");
    setIsBulkOpen(false);
    toast({ title: "Bulk Import Successful" });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container px-4 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary">Contest Management</h1>
            <p className="text-muted-foreground mt-1 text-lg">Manage entries for all Eurovision years and stages.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 px-6 rounded-xl" onClick={() => setIsBulkOpen(true)}>
              <ListPlus className="h-5 w-5 mr-2" /> Bulk Import
            </Button>
            <Button className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90" onClick={openAddDialog}>
              <Plus className="h-5 w-5 mr-2" /> New Entry
            </Button>
          </div>
        </div>

        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b bg-muted/20">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input className="pl-11 h-12 rounded-xl bg-background border-muted/50" placeholder="Filter countries or artists..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold py-4">Country</TableHead>
                <TableHead className="font-bold py-4">Song Title</TableHead>
                <TableHead className="font-bold py-4">Artist</TableHead>
                <TableHead className="font-bold py-4">Year</TableHead>
                <TableHead className="text-right font-bold py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id} className="group transition-colors">
                  <TableCell className="font-bold flex items-center gap-3">
                    <img src={entry.flagUrl || getFlagUrl(entry.country)} alt="" className="h-5 w-8 object-cover rounded shadow-sm" />
                    {entry.country}
                  </TableCell>
                  <TableCell className="text-muted-foreground italic font-medium">{entry.songTitle}</TableCell>
                  <TableCell>{entry.artist}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold">{entry.year}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-destructive transition-colors" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                    No entries found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold">Bulk Import Entries</DialogTitle>
              <p className="text-sm text-muted-foreground">Paste lines in the format: <strong>Country; Artist; Song; VideoUrl</strong></p>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input type="number" value={bulkYear} onChange={(e) => setBulkYear(parseInt(e.target.value))} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select value={bulkStage} onValueChange={(v) => setBulkStage(v as ContestStage)}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Final">Grand Final</SelectItem>
                      <SelectItem value="Semi-Final 1">Semi-Final 1</SelectItem>
                      <SelectItem value="Semi-Final 2">Semi-Final 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea 
                placeholder="Greece; Marina Satti; Zari; https://youtu.be/..."
                className="min-h-[250px] font-mono text-xs rounded-xl p-4 bg-muted/20 border-muted/50"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleBulkImport} className="w-full h-12 rounded-xl text-lg">Import Entries</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
