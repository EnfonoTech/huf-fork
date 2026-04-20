/**
 * Envelope types shared by every v3 page.
 *
 * FrappeDoc<T> is the canonical shape returned by Frappe's REST API for any
 * doctype. Every resource endpoint adds name + audit columns automatically,
 * which T must not collide with.
 */

export type DocStatus = 0 | 1 | 2;

export type FrappeDoc<T> = T & {
  name: string;
  creation: string; // ISO 8601
  modified: string; // ISO 8601
  modified_by: string;
  owner: string;
  docstatus: DocStatus;
};

export type ListResponse<T> = {
  data: FrappeDoc<T>[];
};

export type SingleResponse<T> = {
  data: FrappeDoc<T>;
};

export type MethodResponse<T> = {
  message: T;
};

export type FrappeError = {
  exception: string;
  exc_type: string;
  _server_messages?: string;
  _error_message?: string;
};

export class FrappeApiError extends Error {
  constructor(
    public status: number,
    public data: FrappeError | null,
    message: string,
  ) {
    super(message);
    this.name = "FrappeApiError";
  }
}
