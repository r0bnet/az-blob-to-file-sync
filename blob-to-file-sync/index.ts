import { AzureFunction, Context } from '@azure/functions';
import { EventGridEvent } from '@azure/eventgrid/esm/models';
import * as nconf from 'nconf';

import StorageAccountConfig from './StorageAccountConfig';
import Synchronizer from './Synchronizer';

const eventGridTrigger: AzureFunction = async function (context: Context, eventGridEvent: EventGridEvent): Promise<void> {
  nconf
    .env({
      separator: '__',
      parseValues: true
    })
    .defaults({
      STORAGE_ACCOUNT: {
        SOURCE_CONTAINER_EQUALS_TARGET_SHARE: true
      }
    })
    .required(['STORAGE_ACCOUNT:ACCESS_KEY', 'STORAGE_ACCOUNT:SOURCE_CONTAINER']);

  const config = nconf.get();
  const storageAccountConfig = buildStorageAccountConfig(config);
  const synchronizer = new Synchronizer(storageAccountConfig, context.log);

  try {
    await synchronizer.handleBlobEvent(eventGridEvent);
  } catch (err) {
    context.log.error('Unable to handle event', err);
  }
};

function buildStorageAccountConfig(config: any): StorageAccountConfig {
  const storageAccountConfig: StorageAccountConfig = {
    AccessKey: config.STORAGE_ACCOUNT.ACCESS_KEY,
    SourceContainer: config.STORAGE_ACCOUNT.SOURCE_CONTAINER,
    TargetShare: config.STORAGE_ACCOUNT.SOURCE_CONTAINER_EQUALS_TARGET_SHARE === true ? config.STORAGE_ACCOUNT.SOURCE_CONTAINER : config.STORAGE_ACCOUNT.TARGET_SHARE
  };

  if (config.STORAGE_ACCOUNT.ACCESS_KEY) {
    storageAccountConfig.AccessKey = config.STORAGE_ACCOUNT.ACCESS_KEY;
  }

  return storageAccountConfig;
}

export default eventGridTrigger;
