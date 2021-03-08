export function extractAccountNameFromStorageAccountHostUrl(url: string): string {
  const accountNameRegex = new RegExp(/^https?:\/\/(?<accountName>[^.]+)/);
  const match = url.match(accountNameRegex);

  if (!match) {
    throw new Error(`Unable to extract account name from file host URL: ${url}`);
  }

  return match.groups.accountName;
}