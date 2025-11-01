import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadMetadata,
} from 'firebase/storage';
import { storage } from './client';
import { nanoid } from 'nanoid';

export async function uploadFile(
  file: File,
  path: string,
  metadata?: UploadMetadata
): Promise<{ url: string; storagePath: string; error: null } | { url: null; storagePath: null; error: string }> {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${nanoid()}.${fileExtension}`;
    const fullPath = `${path}/${fileName}`;
    const storageRef = ref(storage, fullPath);

    const uploadMetadata: UploadMetadata = {
      ...metadata,
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        ...metadata?.customMetadata,
      },
    };

    await uploadBytes(storageRef, file, uploadMetadata);
    const url = await getDownloadURL(storageRef);

    return { url, storagePath: fullPath, error: null };
  } catch (error: any) {
    console.error('Upload error:', error);
    return { url: null, storagePath: null, error: error.message };
  }
}

export async function uploadMultipleFiles(
  files: File[],
  basePath: string
): Promise<
  Array<{ url: string; storagePath: string; name: string; type: string; size: number }>
> {
  const uploadPromises = files.map(async (file) => {
    const result = await uploadFile(file, basePath);
    if (result.error) {
      throw new Error(`Failed to upload ${file.name}: ${result.error}`);
    }
    return {
      url: result.url!,
      storagePath: result.storagePath!,
      name: file.name,
      type: file.type,
      size: file.size,
    };
  });

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw error;
  }
}

export async function deleteFile(storagePath: string) {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    return { error: null };
  } catch (error: any) {
    console.error('Delete error:', error);
    return { error: error.message };
  }
}

export async function deleteFiles(storagePaths: string[]) {
  const deletePromises = storagePaths.map((path) => deleteFile(path));

  try {
    await Promise.all(deletePromises);
    return { error: null };
  } catch (error: any) {
    console.error('Multiple delete error:', error);
    return { error: error.message };
  }
}

export async function getFileURL(storagePath: string) {
  try {
    const storageRef = ref(storage, storagePath);
    const url = await getDownloadURL(storageRef);
    return { url, error: null };
  } catch (error: any) {
    console.error('Get URL error:', error);
    return { url: null, error: error.message };
  }
}

export async function listFiles(path: string) {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);

    const files = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          url,
        };
      })
    );

    return { files, error: null };
  } catch (error: any) {
    console.error('List files error:', error);
    return { files: [], error: error.message };
  }
}

// Helper function pro validaci typu souboru
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      const category = type.split('/')[0];
      return file.type.startsWith(category + '/');
    }
    return file.type === type;
  });
}

// Helper function pro validaci velikosti souboru
export function isValidFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}
