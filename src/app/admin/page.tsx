
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Pencil, Trash2, Search, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Entry, ContestStage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default function AdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    country: '',
    year: 2025,
    artist: '',
    songTitle: '',
    videoUrl: '',
    thumbnailUrl: '',
    stage: 'Final' as ContestStage
  });

  const entriesRef = useMemoFirebase(() => collection(db, 'eurovision_entries'), [db]);
  const { data: entries, isLoading } = useCollection<Entry>(entriesRef);

  const filtered = (entries || []).filter(e => 
    e.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.songTitle.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.year - a.year || a.country.localeCompare(b.country));

  const handleDelete = (id: string) => {
    const docRef = doc(db, 'eurovision_entries', id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Entry Removed",
      description: "The song entry has been successfully deleted.",
      variant: "destructive",
    });
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
    const id = `${formData.year}-${stageSlug}-${formData.country.toLowerCase().replace(/\s+/g, '-')}`;
    const docRef = doc(db, 'eurovision_entries', id);
    
    setDocumentNonBlocking(docRef, {
      ...formData,
      id,
      totalPoints: 0,
      voteCount: 0
    }, { merge: true });

    toast({
      title: "Entry Saved",
      description: `${formData.songTitle} by ${formData.artist} has been added.`,
    });

    setFormData({
      country: '',
      year: 2025,
      artist: '',
      songTitle: '',
      videoUrl: '',
      thumbnailUrl: '',
      stage: 'Final'
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Entry Management</h1>
            <p className="text-muted-foreground">Manage Eurovision songs, artists, and stages.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Eurovision Entry</DialogTitle>
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
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input 
                    id="country" 
                    placeholder="e.g. Greece" 
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                  />
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
                  <Label htmlFor="video">YouTube Embed URL</Label>
                  <Input 
                    id="video" 
                    placeholder="https://www.youtube.com/embed/..." 
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
                <Button className="w-full" onClick={handleSave}>Save Entry</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                    <Badge variant="outline" className="text-[10px] py-0">
                      {entry.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>{entry.country}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{entry.artist}</span>
                        {entry.thumbnailUrl && <ImageIcon className="h-3 w-3 text-accent" />}
                      </div>
                      <span className="text-xs text-muted-foreground">{entry.songTitle}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
