import type { BlazeErrorOption } from '../types/error';
import type { RecordUnknown } from '../types/helper';

export class BlazeError extends Error {
  public status: number;
  public errors: RecordUnknown | unknown | null;

  constructor(err: BlazeErrorOption);
  constructor(message: string, status?: number);
  constructor(err: BlazeErrorOption | string, status: number = 500) {
    if (typeof err === 'string') {
      super(err);
      this.status = status;
      this.name = 'BlazeError';
      this.errors = null;
    } else {
      super(err.message);
      this.status = err.status;
      this.errors = err.errors;
      this.name = err.name ?? 'BlazeError';
    }
  }

  public toJSON() {
    return {
      errors: this.errors,
      message: this.message,
      name: this.name,
      status: this.status,
    };
  }
}
