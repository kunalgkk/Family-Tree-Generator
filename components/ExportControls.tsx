'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { exportToPNG, exportToPDF, exportDataAsJSON, exportTreeAsSVG } from '@/utils/export';
import { FamilyTree } from '@/types/family';

interface ExportControlsProps {
  treeData: FamilyTree | null;
  diagramElementId: string;
}

export default function ExportControls({ treeData, diagramElementId }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const handleExport = async (
    exportFn: (id: string, filename: string, scale?: number) => Promise<boolean>,
    filename: string,
    scale?: number
  ) => {
    setIsExporting(true);
    setExportMessage('');

    try {
      await exportFn(diagramElementId, filename, scale);
      setExportMessage(`Successfully exported as ${filename}`);
      setTimeout(() => setExportMessage(''), 3000);
    } catch (error) {
      setExportMessage('Export failed. Please try again.');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    try {
      exportDataAsJSON(treeData, 'family-tree.json');
      setExportMessage('Successfully exported as family-tree.json');
      setTimeout(() => setExportMessage(''), 3000);
    } catch (error) {
      setExportMessage('Export failed. Please try again.');
      console.error('Export error:', error);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Export Family Tree</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={() =>
              handleExport(exportToPNG, 'family-tree.png', 2)
            }
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Export as PNG (High Quality)
          </Button>

          <Button
            onClick={() =>
              handleExport(exportToPNG, 'family-tree-web.png', 1)
            }
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Export as PNG (Web)
          </Button>

          <Button
            onClick={() => handleExport(exportToPDF, 'family-tree.pdf')}
            disabled={isExporting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Export as PDF (Multi-page)
          </Button>

          <Button
            onClick={() => handleExport(exportTreeAsSVG, 'family-tree.svg')}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Export as SVG (Vector)
          </Button>

          <Button
            onClick={handleExportJSON}
            disabled={isExporting}
            variant="outline"
          >
            Export as JSON (Data)
          </Button>
        </div>

        {exportMessage && (
          <div
            className={`p-3 rounded-lg text-sm ${
              exportMessage.includes('Successfully')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {exportMessage}
          </div>
        )}

        <p className="text-xs text-gray-600">
          High Quality PNG: Best for printing. Web PNG: Optimized for screens. PDF: Multi-page
          support for very large trees.
        </p>
      </div>
    </Card>
  );
}
