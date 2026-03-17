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
import { Plus, Pencil, Trash2, Search, ExternalLink, Loader2, Image as ImageIcon, ListPlus, Info, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Entry, ContestStage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getFlagUrl } from '@/lib/utils';

export default function AdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
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

  // Auto-set flag when country changes
  useEffect(() => {
    if (formData.country) {
      setFormData(prev => ({ ...prev, flagUrl: getFlagUrl(prev.country) }));
    }
  }, [formData.country]);

  const entriesRef = useMemoFirebase(() => collection(db, 'eurovision_entries'), [db]);
  const { data: entries, isLoading } = useCollection<Entry>(entriesRef);

  const filtered = (entries || []).filter(e => 
    e.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.songTitle.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.year - a.year || a.country.localeCompare(b.country));

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
        description: "Please fill in all required fields (Country, Artist, Song, Video URL).",
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
      description: `${formData.songTitle} by ${formData.artist} has been ${isEditing ? 'updated' : 'added'}.`,
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
      description: `Successfully added ${count} entries for ${bulkYear} (${bulkStage}).`,
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
            <p className="text-muted-foreground">Manage over 70 years of Eurovision songs and stages.</p>
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
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Bulk Import Entries
                  </DialogTitle>
                  <DialogDescription>
                    Add multiple songs for a specific year and stage. Use the semicolon-separated format.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Target Year</Label>
                      <Input type="number" value={bulkYear} onChange={(e) => setBulkYear(parseInt(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Stage</Label>
                      <Select value={bulkStage} onValueChange={(v) => setBulkStage(v as ContestStage)}>
                        <SelectTrigger>
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
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                      Entries List
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                        <Info className="h-3 w-3" />
                        Format: Country; Artist; Song; VideoUrl
                      </span>
                    </Label>
                    <Textarea 
                      placeholder={"Greece; Marina Satti; ZARI; https://youtube.com/...\nSweden; Marcus & Martinus; Unforgettable; https://youtube.com/..."} 
                      className="min-h-[200px] font-mono text-xs"
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleBulkImport} className="w-full h-12 bg-primary hover:bg-primary/90">
                    Import {bulkText.split('\n').filter(l => l.trim()).length} Entries
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Single Entry
              </Button>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isEditing ? 'Edit' : 'Create'} Eurovision Entry</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input 
                        id="year" 
                        type="number" 
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stage">Stage</Label>
                      <Select 
                        value={formData.stage} 
                        onValueChange={(v) => setFormData({...formData, stage: v as ContestStage})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Final">Grand Final</SelectItem>
                          <SelectItem value="Semi-Final 1">Semi-Final 1</SelectItem>
                          <SelectItem value="Semi-Final 2">Semi-Final 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="country" 
                          placeholder="e.g. Greece" 
                          value={formData.country}
                          onChange={(e) => setFormData({...formData, country: e.target.value})}
                        />
                        {formData.flagUrl && (
                          <div className="h-10 w-14 bg-muted rounded border overflow-hidden flex-shrink-0">
                            <img src={formData.flagUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artist">Artist</Label>
                    <Input 
                      id="artist" 
                      placeholder="e.g. Marina Satti" 
                      value={formData.artist}
                      onChange={(e) => setFormData({...formData, artist: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Song Title</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g. ZARI" 
                      value={formData.songTitle}
                      onChange={(e) => setFormData({...formData, songTitle: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video">YouTube URL</Label>
                    <Input 
                      id="video" 
                      placeholder="https://www.youtube.com/watch?v=..." 
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail" className="flex items-center gap-2">
                      <ImageIcon className="h-3 w-3" />
                      Artist Photo URL (Optional)
                    </Label>
                    <Input 
                      id="thumbnail" 
                      placeholder="https://example.com/artist.jpg" 
                      value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full h-12" onClick={handleSave}>{isEditing ? 'Update' : 'Save'} Entry</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-muted/20">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-9 bg-background" 
                placeholder="Search entries..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Artist & Song</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Loading entries...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.year}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] py-0 border-primary/30 text-primary">
                      {entry.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img src={entry.flagUrl || getFlagUrl(entry.country)} alt="" className="h-4 w-6 object-cover rounded-sm shadow-sm" />
                      {entry.country}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{entry.artist}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{entry.songTitle}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openEditDialog(entry)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <a href={entry.videoUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {!isLoading && filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No entries found. Start by adding a new one!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
