import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Trash2 } from "lucide-react";
import { forceFullReload } from "@/utils/forceReload";
import { toast } from "sonner";

export const DiagnosticActions = () => {
  const [isReloading, setIsReloading] = React.useState(false);

  const handleForceReload = async () => {
    setIsReloading(true);
    try {
      await forceFullReload();
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-destructive" />
          Diagnostic Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
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
          This will delete all documents and chunks, then reload with proper PDF text extraction.
        </p>
      </CardContent>
    </Card>
  );
};