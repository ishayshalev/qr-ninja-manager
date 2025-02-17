export interface QRCode {
  id: string;
  name: string;
  redirectUrl: string;
  projectId: string | null;
}

export type TimeRange = "daily" | "weekly" | "monthly" | "yearly" | "all";