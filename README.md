Blob to File Sync
=================

## Description

This function can be triggered by an Event Grid Event for a Storage Account whereas it only
listens for `BlobCreated` and `BlobDeleted` events. The following table contains the available
environment variables.

## Environment variables

| Name                                                  |   Description       | Required  |
|-------------------------------------------------------|---------------------|-----------|
| STORAGE_ACCOUNT__ACCESS_KEY                           | Access Key          | &check;   |
| STORAGE_ACCOUNT__SOURCE_CONTAINER                     | Source container    | &check;   |
| STORAGE_ACCOUNT__SOURCE_CONTAINER_EQUALS_TARGET_SHARE | source = target?    |           |
| STORAGE_ACCOUNT__TARGET_SHARE                         | Target share        |           |

The storage account access key is needed to access the file share and write / delete the file.
The source container is the name of the blob container that will be "monitored". Only events that
happen in that particular blob container will be handled. You can either specify a target share
to be used for blob to file synchronization or otherwise it will try to sync to a file share that
has the same name as the blob container.

## Test locally
Enter the environment variables in the `local.settings.json`. After that you can check this
documentation to test it: https://docs.microsoft.com/en-us/azure/azure-functions/functions-debug-event-grid-trigger-local

## TODO
- Make the source container variable optional (handle events from all containers)