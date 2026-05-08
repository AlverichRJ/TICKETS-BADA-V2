import { z } from 'zod';

export const updateSystemSettingSchema = z.object({
  appName: z.string().trim().min(2).max(80)
});
