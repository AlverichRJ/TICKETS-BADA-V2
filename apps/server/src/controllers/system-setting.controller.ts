import type { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type { SystemSetting } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError, sendOk } from '../utils/http.js';

const SETTING_ID = 1;
const DEFAULT_APP_NAME = 'Tickets Inventario';

type SystemSettingDto = {
  appName: string;
  logoUrl: string | null;
  updatedAt: string | null;
};

function toDto(setting: SystemSetting | null): SystemSettingDto {
  return {
    appName: setting?.appName || DEFAULT_APP_NAME,
    logoUrl: setting?.logoPath ? `/api/system-settings/logo?v=${setting.updatedAt.getTime()}` : null,
    updatedAt: setting?.updatedAt.toISOString() || null
  };
}

async function getOrCreateSetting() {
  return prisma.systemSetting.upsert({
    where: { id: SETTING_ID },
    update: {},
    create: { id: SETTING_ID, appName: DEFAULT_APP_NAME }
  });
}

async function removePreviousLogo(logoPath?: string | null) {
  if (!logoPath) return;
  try {
    await fs.unlink(path.resolve(logoPath));
  } catch {
    // Si el archivo físico ya no existe, la nueva configuración sigue siendo válida.
  }
}

export async function show(_req: Request, res: Response) {
  const setting = await prisma.systemSetting.findUnique({ where: { id: SETTING_ID } });
  return sendOk(res, toDto(setting));
}

export async function update(req: Request, res: Response) {
  const setting = await prisma.systemSetting.upsert({
    where: { id: SETTING_ID },
    update: {
      appName: req.body.appName,
      updatedById: req.authUser!.id
    },
    create: {
      id: SETTING_ID,
      appName: req.body.appName,
      updatedById: req.authUser!.id
    }
  });

  return sendOk(res, toDto(setting));
}

export async function uploadLogo(req: Request, res: Response) {
  if (!req.file) throw new AppError(400, 'Imagen requerida.');

  const currentSetting = await getOrCreateSetting();
  await removePreviousLogo(currentSetting.logoPath);

  const setting = await prisma.systemSetting.update({
    where: { id: SETTING_ID },
    data: {
      logoPath: req.file.path,
      logoOriginalName: req.file.originalname,
      logoMimeType: req.file.mimetype,
      updatedById: req.authUser!.id
    }
  });

  return sendOk(res, toDto(setting), 201);
}

export async function logo(_req: Request, res: Response) {
  const setting = await prisma.systemSetting.findUnique({ where: { id: SETTING_ID } });
  if (!setting?.logoPath || !setting.logoMimeType) throw new AppError(404, 'Logo no configurado.');

  const absolutePath = path.resolve(setting.logoPath);
  res.setHeader('Content-Type', setting.logoMimeType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(setting.logoOriginalName || 'logo-sistema')}"`);
  res.setHeader('Cache-Control', 'private, max-age=300');
  return res.sendFile(absolutePath);
}
