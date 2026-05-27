import { randomUUID } from 'node:crypto';

export function createId(prefix?: string): string {
  const id = randomUUID().replaceAll('-', '').slice(0, 24);
  return prefix ? `${prefix}_${id}` : id;
}
