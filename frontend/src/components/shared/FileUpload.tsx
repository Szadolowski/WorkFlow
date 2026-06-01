"use client";

import { useState } from "react";
import { getUploadUrlAction } from "@/app/actions/storage.actions";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

// Tu dodaliśmy przekazywanie oryginalnej nazwy pliku do rodzica
interface FileUploadProps {
  onUploadSuccess?: (fileKey: string, fileName: string) => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadedKey(null);

    try {
      const data = await getUploadUrlAction(file.name);

      if (data.error) {
        throw new Error(data.error);
      }

      const { url, fileKey } = data;

      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(
          "Wystąpił błąd podczas bezpośredniego transferu do S3.",
        );
      }

      setUploadedKey(fileKey);
      if (onUploadSuccess) {
        onUploadSuccess(fileKey, file.name); // Przekazujemy file.name
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Wystąpił nieznany błąd zapisu.";
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      <Input
        type="file"
        onChange={handleFileChange}
        disabled={isUploading}
        className="cursor-pointer file:text-primary file:font-semibold"
      />

      {isUploading && (
        <div className="flex items-center text-sm text-muted-foreground gap-2 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" /> Wysyłanie na serwer
          plików...
        </div>
      )}

      {error && (
        <div className="flex items-center text-sm text-destructive font-medium gap-2 bg-destructive/10 p-2 rounded-md">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {uploadedKey && (
        <div className="flex items-center text-sm text-teal-600 font-medium gap-2 bg-teal-50 p-2 rounded-md dark:bg-teal-950/30">
          <CheckCircle2 className="w-4 h-4" /> Plik wgrany i zabezpieczony!
        </div>
      )}
    </div>
  );
}
