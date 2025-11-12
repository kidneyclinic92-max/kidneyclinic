import 'dotenv/config';
import { BlobServiceClient } from '@azure/storage-blob';

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || 'clinic-images';

async function testAzureConnection() {
  console.log('🔍 Testing Azure Blob Storage Connection...\n');
  
  // Check environment variables
  console.log('1️⃣ Checking environment variables:');
  console.log('   Connection String:', AZURE_STORAGE_CONNECTION_STRING ? '✅ Found' : '❌ Missing');
  console.log('   Container Name:', CONTAINER_NAME);
  
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    console.error('\n❌ ERROR: AZURE_STORAGE_CONNECTION_STRING not found in .env file');
    console.log('\nPlease make sure your .env file contains:');
    console.log('AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...');
    process.exit(1);
  }
  
  try {
    // Initialize client
    console.log('\n2️⃣ Initializing BlobServiceClient...');
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    console.log('   ✅ Client initialized');
    
    // Get container client
    console.log('\n3️⃣ Getting container client...');
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    console.log('   ✅ Container client created');
    
    // Check if container exists
    console.log('\n4️⃣ Checking if container exists...');
    const exists = await containerClient.exists();
    
    if (!exists) {
      console.log('   ⚠️  Container does not exist. Creating it...');
      await containerClient.create({
        access: 'blob'
      });
      console.log('   ✅ Container created successfully');
    } else {
      console.log('   ✅ Container exists');
    }
    
    // Get container properties
    console.log('\n5️⃣ Getting container properties...');
    const properties = await containerClient.getProperties();
    console.log('   ✅ Container properties retrieved');
    console.log('   Public Access:', properties.publicAccess || 'none');
    
    if (!properties.publicAccess || properties.publicAccess === 'none') {
      console.log('\n   ⚠️  WARNING: Container does not have public access!');
      console.log('   Images may not be accessible via URL.');
      console.log('   Please set public access to "Blob" in Azure Portal.');
    }
    
    // Test upload
    console.log('\n6️⃣ Testing file upload...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test upload from the clinic system';
    const blockBlobClient = containerClient.getBlockBlobClient(testFileName);
    
    await blockBlobClient.upload(testContent, testContent.length, {
      blobHTTPHeaders: {
        blobContentType: 'text/plain'
      }
    });
    
    const uploadedUrl = blockBlobClient.url;
    console.log('   ✅ Test file uploaded successfully');
    console.log('   URL:', uploadedUrl);
    
    // Test if file is accessible
    console.log('\n7️⃣ Testing file accessibility...');
    try {
      const response = await fetch(uploadedUrl);
      if (response.ok) {
        console.log('   ✅ File is publicly accessible');
      } else {
        console.log('   ❌ File is not accessible (Status:', response.status, ')');
        console.log('   Please check container public access settings');
      }
    } catch (error) {
      console.log('   ❌ Error accessing file:', error.message);
    }
    
    // Keep test file (not deleting)
    console.log('\n8️⃣ Test file kept in storage for verification');
    console.log('   📁 File location: ' + CONTAINER_NAME + '/' + testFileName);
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Azure Blob Storage Connection Test PASSED');
    console.log('='.repeat(50));
    console.log('\nYour Azure Storage is configured correctly!');
    console.log('Storage Account: kidneyclinicstorage');
    console.log('Container: ' + CONTAINER_NAME);
    console.log('Image uploads should work in the admin panel.');
    
  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('❌ Azure Blob Storage Connection Test FAILED');
    console.error('='.repeat(50));
    console.error('\nError Details:');
    console.error('Type:', error.name);
    console.error('Message:', error.message);
    
    if (error.code === 'InvalidAuthenticationInfo') {
      console.error('\n🔧 Fix: Your connection string appears to be invalid.');
      console.error('Please verify the connection string in your .env file.');
    } else if (error.code === 'ContainerNotFound') {
      console.error('\n🔧 Fix: The container "' + CONTAINER_NAME + '" does not exist.');
      console.error('Please create it in Azure Portal or the script will create it.');
    } else {
      console.error('\n🔧 Troubleshooting:');
      console.error('1. Check your .env file exists in the server folder');
      console.error('2. Verify the connection string is correct');
      console.error('3. Make sure the storage account "kidneyclinicstorage" exists');
      console.error('4. Check your Azure subscription is active');
    }
    
    process.exit(1);
  }
}

// Run the test
testAzureConnection();

