'use client';

import { useState } from 'react';
import { Document } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { FileText, Download, Upload, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface CaseDocumentsProps {
  caseId: string;
  documents: Document[];
  onDocumentAdded?: () => void;
}

export function CaseDocuments({ caseId, documents, onDocumentAdded }: CaseDocumentsProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate
    const maxSize = 25 * 1024 * 1024; // 25 MB
    for (const file of files) {
      if (file.size > maxSize) {
        toast({
          title: 'Soubor je příliš velký',
          description: `${file.name} překračuje limit 25 MB`,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setUploading(true);

      // Upload files
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('caseId', caseId);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');
      }

      toast({
        title: 'Soubory nahrány',
        description: 'Dokumenty byly úspěšně nahrány',
        variant: 'success',
      });

      onDocumentAdded?.();

      // Reset input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se nahrát soubory. Zkuste to prosím znovu.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📎';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Dokumenty</h3>
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          {uploading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Nahrávání...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Nahrát
            </>
          )}
        </Button>
        <Input
          id="file-upload"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">Zatím žádné dokumenty</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-2xl">{getFileIcon(doc.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(doc.size / 1024 / 1024).toFixed(2)} MB •{' '}
                    {format(new Date(doc.uploadedAt), 'dd. MM. yyyy', {
                      locale: cs,
                    })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(doc.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
