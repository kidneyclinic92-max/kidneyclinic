import { BlobServiceClient } from '@azure/storage-blob';
import multer from 'multer';
import path from 'path';

// Azure Blob Storage configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || 'clinic-images';

// Initialize Azure Blob Service Client
let blobServiceClient;
let containerClient;

if (AZURE_STORAGE_CONNECTION_STRING) {
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    
    // Create container if it doesn't exist
    await containerClient.createIfNotExists({
      access: 'blob' // Public read access for blobs
    });
    
    console.log('✅ Connected to Azure Blob Storage');
  } catch (error) {
    console.error('❌ Failed to connect to Azure Blob Storage:', error);
  }
} else {
  console.warn('⚠️  Azure Storage connection string not found. Using local storage fallback.');
}

// Configure multer for memory storage (files stored in memory before uploading to Azure)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload file to Azure Blob Storage
export async function uploadToAzure(file) {
  if (!containerClient) {
    throw new Error('Azure Blob Storage not configured');
  }

  try {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    
    // Get blob client
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    
    // Upload file buffer to Azure
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype
      }
    });
    
    // Return the public URL
    return blockBlobClient.url;
  } catch (error) {
    console.error('Upload to Azure failed:', error);
    throw error;
  }
}

// Delete file from Azure Blob Storage (optional - for cleanup)
export async function deleteFromAzure(blobUrl) {
  if (!containerClient) {
    return;
  }

  try {
    // Extract blob name from URL
    const blobName = blobUrl.split('/').pop();
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  } catch (error) {
    console.error('Delete from Azure failed:', error);
  }
}

// Check if Azure is configured
export function isAzureConfigured() {
  return !!containerClient;
}

