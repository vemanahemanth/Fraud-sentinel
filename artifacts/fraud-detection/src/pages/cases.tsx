import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useListCases, useGetCase, useUpdateCase, useAddCaseNote, getListCasesQueryKey, getGetCaseQueryKey } from "@workspace/api-client-react";
import { Briefcase, Clock, Plus, Search, FileText, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export default function CasesInterface() {
  const [page, setPage] = useState(1);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const { data: cases, isLoading: loadingCases } = useListCases({ page, limit: 20 });
  
  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Case Management</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">INVESTIGATION WORKSPACE</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Case
        </Button>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur flex-1">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Active Investigations
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search case ID..." className="pl-8 bg-background" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="font-mono text-xs w-[120px]">CASE ID</TableHead>
                  <TableHead className="font-mono text-xs">TITLE</TableHead>
                  <TableHead className="font-mono text-xs">PRIORITY</TableHead>
                  <TableHead className="font-mono text-xs">STATUS</TableHead>
                  <TableHead className="font-mono text-xs">EST. LOSS</TableHead>
                  <TableHead className="font-mono text-xs text-right">LAST UPDATED</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCases ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i} className="border-border/40">
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  cases?.data.map((c) => (
                    <TableRow key={c.id} className="border-border/40 hover:bg-accent/10 cursor-pointer" onClick={() => setSelectedCaseId(c.id)}>
                      <TableCell className="font-mono text-xs text-primary">{c.caseNumber}</TableCell>
                      <TableCell className="font-medium text-sm">{c.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`uppercase text-[10px] ${
                          c.priority === 'urgent' ? 'border-destructive text-destructive' : 
                          c.priority === 'high' ? 'border-amber-500 text-amber-500' : ''
                        }`}>
                          {c.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          c.status === 'open' ? 'destructive' : 
                          c.status === 'in_progress' ? 'secondary' : 
                          'outline'
                        } className="uppercase text-[10px]">
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">${c.estimatedLoss.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {new Date(c.updatedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CaseDetailSheet caseId={selectedCaseId} onClose={() => setSelectedCaseId(null)} />
    </div>
  );
}

function CaseDetailSheet({ caseId, onClose }: { caseId: string | null, onClose: () => void }) {
  const { data: caseDetail, isLoading } = useGetCase(caseId || "", { query: { enabled: !!caseId } });
  const [noteContent, setNoteContent] = useState("");
  const queryClient = useQueryClient();
  const addNote = useAddCaseNote();
  const updateCase = useUpdateCase();

  const handleAddNote = () => {
    if (!caseId || !noteContent) return;
    addNote.mutate({ id: caseId, data: { content: noteContent, authorId: "current_user", authorName: "Current User" } }, {
      onSuccess: () => {
        setNoteContent("");
        queryClient.invalidateQueries({ queryKey: getGetCaseQueryKey(caseId) });
      }
    });
  };

  const handleStatusChange = (status: "in_progress" | "closed" | "escalated") => {
    if (!caseId) return;
    updateCase.mutate({ id: caseId, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCaseQueryKey(caseId) });
        queryClient.invalidateQueries({ queryKey: getListCasesQueryKey() });
      }
    });
  };

  return (
    <Sheet open={!!caseId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] border-border/40 overflow-y-auto sm:max-w-xl">
        {isLoading ? (
          <div className="space-y-4 pt-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full mt-8" />
          </div>
        ) : caseDetail ? (
          <>
            <SheetHeader className="mb-6">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                  {caseDetail.caseNumber}
                </SheetTitle>
                <Badge variant={caseDetail.status === 'open' ? 'destructive' : 'secondary'} className="uppercase">
                  {caseDetail.status}
                </Badge>
              </div>
              <SheetDescription className="text-base text-foreground mt-2">
                {caseDetail.title}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider">Priority</p>
                  <p className="font-medium capitalize">{caseDetail.priority}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider">Est. Loss</p>
                  <p className="font-medium font-mono">${caseDetail.estimatedLoss.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider">Type</p>
                  <p className="font-medium">{caseDetail.fraudType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider">Created</p>
                  <p className="font-medium text-sm">{new Date(caseDetail.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {caseDetail.description && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Description</h3>
                  <div className="bg-muted/30 p-3 rounded-md text-sm">
                    {caseDetail.description}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Case Notes</h3>
                </div>
                
                <div className="space-y-3">
                  {caseDetail.notes.map((note) => (
                    <div key={note.id} className="bg-card border border-border/40 p-3 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-xs">{note.authorName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{note.content}</p>
                    </div>
                  ))}
                  {caseDetail.notes.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No notes yet.</p>
                  )}
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-border/40">
                  <Textarea 
                    placeholder="Add a case note..." 
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="resize-none"
                  />
                  <Button onClick={handleAddNote} disabled={!noteContent || addNote.isPending} size="sm" className="w-full">
                    Add Note
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t border-border/40 flex gap-2">
                {caseDetail.status !== 'closed' && (
                  <>
                    <Button variant="outline" className="flex-1" onClick={() => handleStatusChange("in_progress")} disabled={updateCase.isPending}>
                      Mark In Progress
                    </Button>
                    <Button variant="default" className="flex-1" onClick={() => handleStatusChange("closed")} disabled={updateCase.isPending}>
                      Close Case
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}