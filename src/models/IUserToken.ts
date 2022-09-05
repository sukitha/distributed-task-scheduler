export interface IUserToken {
  sub: string;
  name: string;
  roles: string[];
  mobile: string;
  region: string;
  city: string;
  shopId?: string;
  shops?: string[];
  restore?: {
    from: string;
    mode: 'full' | 'partial',
    at: number;
  }
  counter?: {
    id: string,
    categories: string[];
  }
}