declare interface CommitInfo extends Record<string, string> {
  sha: string;
  message: string;
  author: string;
}
