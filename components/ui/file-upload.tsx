'use client';

import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image as ImageIcon, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/utils';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number;
  maxFiles?: number;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  className?: string;
}

export function FileUpload({
  onFilesSelected,
  maxSize = 25 * 1024 * 1024, // 25 MB
  maxFiles = 10,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  },
  multiple = true,
  className,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles, rejectedFiles) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`Soubor je příliš velký. Maximální velikost je ${formatFileSize(maxSize)}.`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Nepodporovaný typ souboru.');
        } else {
          setError('Chyba při nahrávání souboru.');
        }
        return;
      }

      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
      setFiles(newFiles);
      onFilesSelected(newFiles);
    },
    accept,
    maxSize,
    maxFiles,
    multiple,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          files.length > 0 && 'border-primary/50 bg-primary/5'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          {isDragActive ? (
            <span className="font-medium text-primary">Pusťte soubory zde...</span>
          ) : (
            <>
              <span className="font-medium text-foreground">Klikněte pro nahrání</span> nebo
              přetáhněte soubory
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, DOC, DOCX, JPG, PNG (max. {formatFileSize(maxSize)})
        </p>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Vybrané soubory ({files.length}):</p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card text-card-foreground"
            >
              {getFileIcon(file)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Odstranit</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
