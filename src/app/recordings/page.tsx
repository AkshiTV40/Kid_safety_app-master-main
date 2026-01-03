'use client';

import { useEffect, useState } from 'react';
import { listRecordings, getRecording, deleteRecording } from '@/lib/recordings';
import { Button } from '@/components/ui/button';
import Thumbnail from './components/thumbnail';
import Duration from './components/duration';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function RecordingsPage() {
  const { toast } = useToast();
  const [recs, setRecs] = useState<Array<{id:string,timestamp:number,size:number,type:string}>>([]);

  const load = async () => {
    const r = await listRecordings();
    setRecs(r.sort((a,b)=>b.timestamp-a.timestamp));
  };

  useEffect(()=>{ load(); }, []);

  const onDownload = async (id:string, name?:string) => {
    const blob = await getRecording(id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name || `recording-${id}.webm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onUpload = async (id:string) => {
    const blob = await getRecording(id);
    if (!blob) return;
    try {
      const fd = new FormData();
      fd.append('file', blob, `recording-${id}.webm`);
      const res = await fetch('/api/recordings/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Upload successful' });
    } catch (e) {
      console.error('Upload failed', e);
      toast({ variant: 'destructive', title: 'Upload failed' });
    }
  };

  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const confirmDelete = (id:string) => {
    setDeleteCandidate(id);
    setIsDeleteOpen(true);
  };

  const onDelete = async () => {
    if (!deleteCandidate) return;
    await deleteRecording(deleteCandidate);
    setIsDeleteOpen(false);
    setDeleteCandidate(null);
    await load();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Recordings</h1>
      {recs.length === 0 ? (
        <p className="text-muted-foreground">No recordings yet. Use the Guardian card to start recording.</p>
      ) : (
        <div className="space-y-4">
          {recs.map(r => (
            <div key={r.id} className="p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Thumbnail id={r.id} />
                  <div>
                    <div className="font-medium">{new Date(r.timestamp).toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{(r.size/1024/1024).toFixed(2)} MB • <Duration id={r.id} /></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={()=>onDownload(r.id)} size="sm">Download</Button>
                  <Button onClick={()=>onUpload(r.id)} size="sm">Upload</Button>
                  <Button onClick={()=>confirmDelete(r.id)} variant="destructive" size="sm">Delete</Button>
                </div>
              </div>
              <div className="mt-3">
                <VideoPlayer id={r.id} />
              </div>
            </div>
          ))}

          <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete recording</AlertDialogTitle>
                <AlertDialogDescription>Are you sure you want to permanently delete this recording?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

function VideoPlayer({id}:{id:string}){
  const [src, setSrc] = useState<string | null>(null);
  useEffect(()=>{
    let mounted=true;
    (async ()=>{
      const b = await getRecording(id);
      if (!b) return;
      const url = URL.createObjectURL(b);
      if (mounted) setSrc(url);
    })();
    return ()=>{ mounted=false; if (src) { URL.revokeObjectURL(src); } }
  }, [id]);

  if (!src) return <div className="text-sm text-muted-foreground">Loading...</div>;
  return <video src={src} controls className="w-full rounded-md" />;
}
