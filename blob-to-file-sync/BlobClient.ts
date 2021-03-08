import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';

import { extractAccountNameFromStorageAccountHostUrl } from './Util';

export default class BlobClient {
  private containerClient: ContainerClient;

  constructor(storageAccountBlobUrl: string, accessKey: string, containerName: string) {
    const accountName = extractAccountNameFromStorageAccountHostUrl(storageAccountBlobUrl);
    const credentials = new StorageSharedKeyCredential(accountName, accessKey);
    const blobServiceClient = new BlobServiceClient(storageAccountBlobUrl, credentials);
    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  async downloadBlob(blobName: string): Promise<Buffer> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    return await blobClient.downloadToBuffer();
  }
}