import { ShareClient, ShareFileClient, ShareServiceClient, StorageSharedKeyCredential } from '@azure/storage-file-share';

import { extractAccountNameFromStorageAccountHostUrl } from './Util';

interface FilePath {
  Directory: string;
  FileName: string;
}

export default class FileShareClient {
  private shareClient: ShareClient;

  constructor(storageAccountFileHost: string, accessKey: string, shareName: string) {
    const accountName = extractAccountNameFromStorageAccountHostUrl(storageAccountFileHost);
    const credentials = new StorageSharedKeyCredential(accountName, accessKey);
    const fileShareClient = new ShareServiceClient(storageAccountFileHost, credentials);
    this.shareClient = fileShareClient.getShareClient(shareName);
  }

  async createFile(path: string, content: Buffer): Promise<void> {
    await this.shareClient.createIfNotExists();

    let fileClient: ShareFileClient;
    if (path.includes('/')) {
      const filePath = this.parseFilePath(path);
      let directoryClient = this.shareClient.rootDirectoryClient;
      
      const folderHierachy = filePath.Directory.split('/');
      for (const dir of folderHierachy) {
        directoryClient = directoryClient.getDirectoryClient(dir);
        await directoryClient.createIfNotExists(); 
      }

      fileClient = directoryClient.getFileClient(filePath.FileName);
    } else {
      const directoryClient = this.shareClient.rootDirectoryClient;
      fileClient = directoryClient.getFileClient(path);
    }

    await fileClient.create(content.length);
    await fileClient.uploadRange(content, 0, content.length);
  }

  async deleteFile(path: string): Promise<void> {
    await this.shareClient.createIfNotExists();

    let fileClient: ShareFileClient;
    if (path.includes('/')) {
      const filePath = this.parseFilePath(path);
      const directoryClient = this.shareClient.getDirectoryClient(filePath.Directory);
      fileClient = directoryClient.getFileClient(filePath.FileName);
    } else {
      const directoryClient = this.shareClient.rootDirectoryClient;
      fileClient = directoryClient.getFileClient(path);
    }

    await fileClient.deleteIfExists();
  }

  private parseFilePath(filePath: string): FilePath {
    const filePathRegex = new RegExp(/^(?<directory>.+)\/(?<fileName>.+)$/);
    const match = filePath.match(filePathRegex);
    if (!match) {
      throw new Error(`Unable to parse file path into directory and file name: ${filePath}`);
    }
    return {
      Directory: match.groups.directory,
      FileName: match.groups.fileName
    };
  }
}