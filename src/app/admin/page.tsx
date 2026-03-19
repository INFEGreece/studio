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
      toast({ title: "UID Copied", description: "Now add this to your roles_admin collection in Firebase." });
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
          <div className="max-w-md w-full text-center space-y-6 bg-card border rounded-2xl p-8 shadow-xl">
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">You must be an administrator to manage entries.</p>
            
            {user && (
              <div className="p-4 bg-muted/50 rounded-lg text-left space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Admin ID (UID):</p>
                <div className="flex items-center gap-2 bg-background border p-2 rounded text-xs font-mono break-all">
                  {user.uid}
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={copyUid}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight italic">
                  Copy this ID and add it as a Document ID in a new Firestore collection called "roles_admin" to get access.
                </p>
              </div>
            )}

            <Button variant="outline" className="w-full" asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure?")) {
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
      toast({ title: "Error", description: "Missing required fields.", variant: "destructive" });
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
    toast({ title: "Entry Saved" });
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
    toast({ title: "Bulk Import Complete" });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-headline font-bold text-primary">Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
              <ListPlus className="h-4 w-4 mr-2" /> Bulk
            </Button>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" /> Single
            </Button>
          </div>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search entries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Song</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <img src={entry.flagUrl || getFlagUrl(entry.country)} alt="" className="h-4 w-6 object-cover rounded-sm" />
                    {entry.country}
                  </TableCell>
                  <TableCell>{entry.songTitle}</TableCell>
                  <TableCell>{entry.year}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Bulk Import</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea 
                placeholder="Country; Artist; Song; VideoUrl"
                className="min-h-[200px] font-mono text-xs"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
            </div>
            <DialogFooter><Button onClick={handleBulkImport} className="w-full">Import</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
