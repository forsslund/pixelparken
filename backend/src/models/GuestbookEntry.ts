export interface GuestbookEntry {
  id: string;
  username: string;
  message: string;
  avatar: string;
  createdAt: Date;
}

export interface CreateGuestbookEntryRequest {
  username: string;
  message: string;
  avatar: string;
}
