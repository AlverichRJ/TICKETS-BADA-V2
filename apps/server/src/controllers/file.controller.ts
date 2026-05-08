import type { Request, Response } from 'express';
import path from 'path';
import { FileType } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError, sendOk } from '../utils/http.js';

export async function uploadDeviceFile(req: Request, res: Response) {
  if (!req.file) throw new AppError(400, 'Archivo requerido.');
  const type = Object.values(FileType).includes(req.body.type) ? req.body.type : FileType.OTHER;

  const file = await prisma.file.create({
    data: {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      path: req.file.path,
      type,
      deviceId: String(req.params.deviceId),
      userId: req.body.userId || null,
      uploadedById: req.authUser!.id
    }
  });

  return sendOk(res, file, 201);
}

export async function downloadFile(req: Request, res: Response) {
  const file = await prisma.file.findUnique({ where: { id: String(String(req.params.id)) } });
  if (!file) throw new AppError(404, 'Archivo no encontrado.');

  const absolutePath = path.resolve(file.path);
  if (req.query.inline === 'true') {
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    return res.sendFile(absolutePath);
  }

  return res.download(absolutePath, file.originalName);
}
