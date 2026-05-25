export interface User {
  id: number;
  name: string;
  phone: string;
  password: string;
  role: "owner" | "accountant";
}