import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Trash2, TestTube } from "lucide-react";
import { forceFullReload } from "@/utils/forceReload";
import { testPDFExtraction } from "@/utils/testPDFExtraction";
import { toast } from "sonner";

export const DiagnosticActions = () => {
  const [isReloading, setIsReloading] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);

  const handleForceReload = async () => {
    setIsReloading(true);
    try {
      await forceFullReload();
    } finally {
      setIsReloading(false);
    }
  };

  const handleTestPDF = async () => {
    setIsTesting(true);
    try {
      await testPDFExtraction();
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="mx-4 mb-4 border-border bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-destructive" />
          Diagnostic Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          onClick={handleTestPDF}
          disabled={isTesting}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <TestTube className={`w-3 h-3 mr-2 ${isTesting ? 'animate-pulse' : ''}`} />
          {isTesting ? 'Testing...' : 'Test PDF Extraction'}
        </Button>
        
        <Button 
          onClick={handleForceReload}
          disabled={isReloading}
          variant="destructive"
          size="sm"
          className="w-full"
        >
          <RefreshCcw className={`w-3 h-3 mr-2 ${isReloading ? 'animate-spin' : ''}`} />
          {isReloading ? 'Reloading...' : 'Force Complete Reload'}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Test the PDF extraction first, then use reload if needed.
        </p>
      </CardContent>
    </Card>
  );
};