
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { MOCK_ENTRIES } from '@/lib/data';
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
import { Plus, Pencil, Trash2, Search, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const [entries, setEntries] = useState(MOCK_ENTRIES);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filtered = entries.filter(e => 
    e.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    toast({
      title: "Entry Removed",
      description: "The song entry has been successfully deleted.",
      variant: "destructive",
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold">Entry Management</h1>
            <p className="text-muted-foreground">Manage Eurovision songs, artists, and media.</p>
          </div>
          
          <Dialog>
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
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" placeholder="e.g. Greece" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" type="number" defaultValue={2024} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artist">Artist</Label>
                  <Input id="artist" placeholder="e.g. Marina Satti" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Song Title</Label>
                  <Input id="title" placeholder="e.g. ZARI" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video">YouTube Embed URL</Label>
                  <Input id="video" placeholder="https://www.youtube.com/embed/..." />
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full">Save Entry</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden">
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
                <TableHead>Country</TableHead>
                <TableHead>Artist & Song</TableHead>
                <TableHead>Media</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.year}</TableCell>
                  <TableCell>{entry.country}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{entry.artist}</span>
                      <span className="text-xs text-muted-foreground">{entry.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a 
                      href={entry.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Video Link
                    </a>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </Button>
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
          
          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No entries found matching your search.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
