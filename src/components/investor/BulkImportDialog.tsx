import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const BulkImportDialog = ({ open, onOpenChange, onSuccess }: BulkImportDialogProps) => {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState<{
    total: number;
    successful: number;
    failed: number;
  } | null>(null);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: "No data",
        description: "Please paste CSV data to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(0);
    let successful = 0;
    let failed = 0;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const lines = csvData.trim().split('\n');
      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      
      const nameIndex = headers.findIndex(h => h.includes('name') && !h.includes('firm'));
      const websiteIndex = headers.findIndex(h => h.includes('website'));
      const locationIndex = headers.findIndex(h => h.includes('location') || h.includes('headquarters'));
      const firmIndex = headers.findIndex(h => h.includes('firm'));
      const typeIndex = headers.findIndex(h => h.includes('type'));
      const stageIndex = headers.findIndex(h => h.includes('stage'));

      const dataRows = lines.slice(1);
      const total = dataRows.length;
      setImportStats({ total, successful: 0, failed: 0 });

      for (let i = 0; i < dataRows.length; i++) {
        const line = dataRows[i].trim();
        if (!line) continue;

        try {
          const values = parseCSVLine(line);
          
          const name = nameIndex >= 0 ? values[nameIndex]?.trim() : '';
          if (!name) {
            failed++;
            continue;
          }

          const website = websiteIndex >= 0 ? values[websiteIndex]?.trim() : null;
          const location = locationIndex >= 0 ? values[locationIndex]?.trim() : null;
          const firmName = firmIndex >= 0 ? values[firmIndex]?.trim() : null;
          const type = typeIndex >= 0 ? values[typeIndex]?.trim() : null;
          const stageData = stageIndex >= 0 ? values[stageIndex]?.trim() : null;

          // Parse stages if available
          let stages: string[] | null = null;
          if (stageData) {
            stages = stageData.split(/[,;]/).map(s => s.trim()).filter(s => s);
          }

          const investorData = {
            name,
            firm_name: firmName,
            website,
            geographies: location ? [location] : null,
            stage: stages,
            tags: type ? [type] : null,
            pipeline_stage: 'research',
            priority: 'medium',
            user_id: user.id,
            import_source: 'bulk_import'
          };

          const { error } = await supabase
            .from("investors")
            .insert([investorData]);

          if (error) throw error;
          successful++;
        } catch (error) {
          console.error("Error importing row:", error);
          failed++;
        }

        setProgress(((i + 1) / total) * 100);
        setImportStats({ total, successful, failed });
      }

      toast({
        title: "Import complete",
        description: `Successfully imported ${successful} investors. ${failed} failed.`,
      });

      if (successful > 0) {
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setCsvData("");
    setProgress(0);
    setImportStats(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import Investors
          </DialogTitle>
          <DialogDescription>
            Paste your CSV data below. Format: Name, Website, Headquarters location, Firm Name, Type, Stage
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-data">CSV Data</Label>
            <Textarea
              id="csv-data"
              rows={12}
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="Name,Website,Headquarters location,Firm Name,Type,Stage
Airtree,https://airtree.vc/,Sydney,Airtree Ventures,VC,Seed;Series A
Blackbird,https://blackbird.vc/,Sydney,Blackbird Ventures,VC,Seed;Series A;Series B"
              className="font-mono text-sm"
              disabled={importing}
            />
          </div>

          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Importing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {importStats && !importing && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-2xl font-bold">{importStats.total}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                  <div className="text-2xl font-bold text-green-500">{importStats.successful}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                  <div className="text-2xl font-bold text-red-500">{importStats.failed}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              disabled={importing}
            >
              Clear
            </Button>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={importing}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={importing || !csvData.trim()}
              >
                {importing ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
