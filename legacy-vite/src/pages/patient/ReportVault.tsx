import { useState, useRef } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { REPORTS } from "@/lib/mock-data";
import { UploadCloud, FileText, Image as ImageIcon, Trash2, Download, Eye, FolderHeart } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReportVault() {
  const [files, setFiles] = useState(REPORTS);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).map((f, i) => ({
      id: `new-${Date.now()}-${i}`,
      name: f.name,
      size: `${Math.round(f.size / 1024)} KB`,
      type: f.type.startsWith("image") ? "image" : "pdf",
    }));
    setFiles((prev) => [...next, ...prev]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Patient · Reports</div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Report Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">Keep prescriptions, scans, and lab reports in one private place.</p>
        </div>
        <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5 text-[11px]">
          <FolderHeart className="h-3.5 w-3.5 text-primary" />
          {files.length} files · 2.1 MB used
        </div>
      </div>

      {/* Dropzone */}
      <GlassCard
        variant="strong"
        className={cn(
          "border-2 border-dashed transition-all",
          drag ? "border-primary/60 bg-primary/5 shadow-glow" : "border-border/60"
        )}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-5 py-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 grid place-items-center">
            <UploadCloud className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="text-base font-semibold">Drag & drop files here</div>
            <div className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10 MB. Files are encrypted in transit.</div>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button onClick={() => inputRef.current?.click()} className="bg-gradient-emerald text-primary-foreground shadow-glow">
            <UploadCloud className="h-4 w-4 mr-1.5" /> Browse files
          </Button>
        </div>
      </GlassCard>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((f) => (
          <GlassCard key={f.id} hover className="group p-4">
            <div className="aspect-[4/3] rounded-xl bg-secondary/40 grid place-items-center mb-3 relative overflow-hidden">
              {f.type === "image" ? (
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              ) : (
                <FileText className="h-10 w-10 text-muted-foreground" />
              )}
              <span className="absolute top-2 left-2 text-[10px] uppercase glass rounded-full px-2 py-0.5">{f.type}</span>
              <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center gap-2">
                <div className="flex gap-2">
                  <button className="glass glass-hover h-9 w-9 rounded-full grid place-items-center"><Eye className="h-4 w-4" /></button>
                  <button className="glass glass-hover h-9 w-9 rounded-full grid place-items-center"><Download className="h-4 w-4" /></button>
                  <button className="glass glass-hover h-9 w-9 rounded-full grid place-items-center text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold truncate">{f.name}</div>
            <div className="text-[11px] text-muted-foreground">{f.size}</div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
