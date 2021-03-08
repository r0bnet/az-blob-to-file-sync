import { EventGridEvent } from '@azure/eventgrid/esm/models';

import BlobClient from './BlobClient';
import FileShareClient from './FileShareClient';
import Logger from './Logger';
import StorageAccountConfig from './StorageAccountConfig';

interface BlobUrl {
  Protocol: string;
  BlobHost: string;
  ContainerName: string;
  BlobPath: string;
  BlobName: string;
}

enum EventType {
  BlobCreated = 'Microsoft.Storage.BlobCreated',
  BlobDeleted = 'Microsoft.Storage.BlobDeleted'
}

export default class Synchronizer {
  private storageAccountConfig: StorageAccountConfig;
  private logger: Logger;

  constructor(storageAccountConfig: StorageAccountConfig, logger: Logger) {
    this.storageAccountConfig = storageAccountConfig;
    this.logger = logger;
  }

  async handleBlobEvent(event: EventGridEvent): Promise<void> {
    if (!event) {
      throw new Error(`Invalid event: ${typeof event}`);
    }

    const blobUrl = this.parseBlobUrl(event.data.url);

    const eventType = event.eventType as EventType;
    switch (eventType) {
    case EventType.BlobCreated:
      this.logger.info('Handling blob created event...');
      await this.handleBlobCreatedEvent(blobUrl);
      break;
    case EventType.BlobDeleted:
      this.logger.info('Handling blob deleted event...');
      await this.handleBlobDeletedEvent(blobUrl);
      break;
    default:
      this.logger.info(`Unknown event type '${event.eventType}', skipping...`);
      return;
    }
  }

  private parseBlobUrl(url: string): BlobUrl {
    if (!url) {
      throw new Error(`Unable to parse blob url. Type: ${typeof url}, value: ${url}`);
    }

    const blobUrlRegex = new RegExp(/^(?<protocol>https?):\/\/(?<accountHost>[^/]+)\/(?<containerName>[^/]+)\/(?<blobPath>.+)$/);
    const match = url.match(blobUrlRegex);
    if (!match) {
      throw new Error('Unable to parse blob url. Blob URL regex doesn\'t match');
    }

    const blobNameRegex = new RegExp(/(?<blobName>[^/]+)$/);
    const blobPath = match.groups.blobPath;
    const blobName = blobPath.match(blobNameRegex).groups.blobName;

    return {
      Protocol: match.groups.protocol,
      BlobHost : match.groups.accountHost,
      ContainerName: match.groups.containerName,
      BlobPath: blobPath,
      BlobName: blobName
    };
  }

  private async handleBlobCreatedEvent(blobUrl: BlobUrl): Promise<void> {
    const blobHostUrl = `${blobUrl.Protocol}://${blobUrl.BlobHost}`;
    const blobClient = new BlobClient(blobHostUrl, this.storageAccountConfig.AccessKey, blobUrl.ContainerName);

    this.logger.info(`Starting download of '${blobUrl.BlobPath}' from container '${blobUrl.ContainerName}'`);
    const fileBuffer = await blobClient.downloadBlob(blobUrl.BlobPath);
    this.logger.info('Download finished');

    const fileHostUrl = blobHostUrl.replace('.blob.', '.file.');
    const fileShareClient = new FileShareClient(fileHostUrl, this.storageAccountConfig.AccessKey, this.storageAccountConfig.TargetShare);

    this.logger.info(`Starting upload of '${blobUrl.BlobPath}'`);
    await fileShareClient.createFile(blobUrl.BlobPath, fileBuffer);
    this.logger.info('Upload finished');
  }

  private async handleBlobDeletedEvent(blobUrl: BlobUrl): Promise<void> {
    const blobHostUrl = `${blobUrl.Protocol}://${blobUrl.BlobHost}`;
    const fileHostUrl = blobHostUrl.replace('.blob.', '.file.');
    const fileShareClient = new FileShareClient(fileHostUrl, this.storageAccountConfig.AccessKey, this.storageAccountConfig.TargetShare);
    this.logger.info(`Deleting file '${blobUrl.BlobPath}'`);
    await fileShareClient.deleteFile(blobUrl.BlobPath);
    this.logger.info('Deletion finished');
  }
}

