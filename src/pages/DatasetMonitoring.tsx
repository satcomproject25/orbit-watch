import DashboardHeader from "@/components/DashboardHeader";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DatasetMonitoring() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <h1 className="text-lg font-bold text-foreground">Dataset Monitoring (Offline Mode)</h1>

        <div className="glass-card p-6">
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-foreground font-semibold mb-1">Upload Signal Dataset</h2>
            <p className="text-sm text-muted-foreground mb-4">Supported formats: CSV, MAT, TXT</p>
            <Button variant="outline" className="border-primary text-primary">
              <FileText className="h-4 w-4 mr-2" /> Select File
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-4 text-center">
            After upload, interference detection algorithm will analyze the dataset and display spectrum results.
            Backend integration pending.
          </p>
        </div>
      </div>
    </div>
  );
}
