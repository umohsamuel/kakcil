export interface User {
  id: string;
  name: string;
  email: string;
  is_verified: boolean;
  subscription_tier?: "free" | "plus" | "pro";
  subscription_status?: string;
}

export interface AddUserParams {
  name: string;
  email: string;
  password: string;
  is_verified?: boolean;
}

export interface UpdateUserParams {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  is_verified?: boolean;
}

