export type UserRole = 'admin' | 'user';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone?: string | null;
  role: UserRole;
  must_change_password?: boolean;
  created_at: string;
}

export interface Fanzine {
  id: string;
  title: string;
  description: string | null;
  price: number;
  cover_url: string | null;
  pdf_path: string;
  is_active: boolean;
  created_at: string;
}

export interface UserAccess {
  id: string;
  user_id: string;
  fanzine_id: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  granted_at: string;
  fanzine?: Fanzine;
  profile?: Profile;
}

export interface PaymentNotification {
  id: string;
  user_id: string;
  fanzine_id: string;
  reference_code: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profile?: Profile;
  fanzine?: Fanzine;
}
