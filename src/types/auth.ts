
export type Profile = {
  id: string;
  is_approved: boolean;
  [key: string]: any;
};

export type ProfileChanges = {
  new: Profile;
  old: Profile | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
};
