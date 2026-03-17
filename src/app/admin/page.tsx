
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, ExternalLink, Loader2, Image as ImageIcon, ListPlus, Info, FileText, ShieldAlert } from 'lucide-react';
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
  
  // Admin Authorization check
  const adminDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);
  
  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminDocRef);
  const isAdmin = !!adminData;

  // Bulk import state
  const [bulkText, setBulkText] = useState("");
  const [bulkYear, setBulkYear] = useState(2026);
  const [bulkStage, setBulkStage] = useState<ContestStage>('Final');

  // Form state
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

  // Sorting alphabetically by country
  const filtered = (entries || [])
    .filter(e => 
      e.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.songTitle.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.country.localeCompare(b.country));

  if (isUserLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || (!isAdmin && !isAdminLoading)) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6 bg-card border rounded-2xl p-8 shadow-xl">
            <div className="bg-destructive/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold font-headline">Access Denied</h1>
              <p className="text-muted-foreground">
                You do not have administrative privileges to access this area. 
                Please sign in with an authorized account.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <Link href="/">
                <Button variant="outline" className="w-full">Return Home</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      const docRef = doc(db, 'eurovision_entries', id);
      deleteDocumentNonBlocking(docRef);
      toast({
        title: "Entry Removed",
        description: "The song entry has been successfully deleted.",
        variant: "destructive",
      });
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
    if (!formData.country || !formData.artist || !formData.songTitle || !formData.videoUrl) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
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

    toast({
      title: isEditing ? "Entry Updated" : "Entry Saved",
      description: `${formData.songTitle} has been saved.`,
    });

    setIsDialogOpen(false);
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n');
    let count = 0;

    lines.forEach(line => {
      if (!line.trim()) return;
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
        count++;
      }
    });

    toast({
      title: "Bulk Import Complete",
      description: `Successfully added ${count} entries.`,
    });

    setBulkText("");
    setIsBulkOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Entry Management</h1>
            <p className="text-muted-foreground">Managing 70 years of Eurovision history.</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/5">
                  <ListPlus className="h-4 w-4 mr-2" />
                  Bulk Import
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Bulk Import Entries</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input type="number" value={bulkYear} onChange={(e) => setBulkYear(parseInt(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Stage</Label>
                      <Select value={bulkStage} onValueChange={(v) => setBulkStage(v as ContestStage)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Final">Grand Final</SelectItem>
                          <SelectItem value="Semi-Final 1">Semi-Final 1</SelectItem>
                          <SelectItem value="Semi-Final 2">Semi-Final 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex justify-between">
                      List
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        Format: Country; Artist; Song; VideoUrl
                      </span>
                    </Label>
                    <Textarea 
                      className="min-h-[200px] font-mono text-xs"
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleBulkImport} className="w-full">Import Entries</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Single Entry
              </Button>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{isEditing ? 'Edit' : 'Create'} Entry</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input id="year" type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stage">Stage</Label>
                      <Select value={formData.stage} onValueChange={(v) => setFormData({...formData, stage: v as ContestStage})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Final">Grand Final</SelectItem>
                          <SelectItem value="Semi-Final 1">Semi-Final 1</SelectItem>
                          <SelectItem value="Semi-Final 2">Semi-Final 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="country" 
                        value={formData.country}
                        onChange={(e) => {
                          const country = e.target.value;
                          setFormData({ ...formData, country, flagUrl: getFlagUrl(country) });
                        }}
                      />
                      <div className="h-10 w-14 bg-muted rounded border overflow-hidden flex-shrink-0">
                        <img src={formData.flagUrl || getFlagUrl(formData.country)} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artist">Artist</Label>
                    <Input id="artist" value={formData.artist} onChange={(e) => setFormData({...formData, artist: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Song Title</Label>
                    <Input id="title" value={formData.songTitle} onChange={(e) => setFormData({...formData, songTitle: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video">YouTube URL</Label>
                    <Input id="video" value={formData.videoUrl} onChange={(e) => setFormData({...formData, videoUrl: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail" className="flex items-center gap-2">
                      <ImageIcon className="h-3 w-3" />
                      Artist Photo URL (Optional)
                    </Label>
                    <Input id="thumbnail" placeholder="Auto-uses flag if empty" value={formData.thumbnailUrl} onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full" onClick={handleSave}>Save Entry</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-muted/10">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Artist & Song</TableHead>
                <TableHead>Year/Stage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEntriesLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell></TableRow>
              ) : filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img src={entry.flagUrl || getFlagUrl(entry.country)} alt="" className="h-4 w-6 object-cover rounded-sm" />
                      <span className="font-medium">{entry.country}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{entry.artist}</span>
                      <span className="text-xs text-muted-foreground">{entry.songTitle}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{entry.year}</span>
                      <Badge variant="outline" className="text-[10px] py-0">{entry.stage}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openEditDialog(entry)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
