import type { Random } from './helper';

export interface BlazeErrorOption {
  errors: Random | unknown | null;
  status: number;
  message: string;
  name?: string | null;
}
