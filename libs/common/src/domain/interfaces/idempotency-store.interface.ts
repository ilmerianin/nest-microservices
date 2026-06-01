export interface IIdempotencyStore {
  hasProcessed(id: string): boolean;
  markProcessed(id: string): void;
}
