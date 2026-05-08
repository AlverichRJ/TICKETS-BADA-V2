import type { Request, Response } from 'express';
import { createTicket, getTicket, listTickets, updateTicket } from '../services/ticket.service.js';
import { sendOk } from '../utils/http.js';

export async function create(req: Request, res: Response) {
  const ticket = await createTicket(req.authUser!, req.body);
  return sendOk(res, ticket, 201);
}

export async function index(req: Request, res: Response) {
  const tickets = await listTickets(req.authUser!);
  return sendOk(res, tickets);
}

export async function show(req: Request, res: Response) {
  const ticket = await getTicket(req.authUser!, String(req.params.id));
  return sendOk(res, ticket);
}

export async function update(req: Request, res: Response) {
  const ticket = await updateTicket(req.authUser!, String(req.params.id), req.body);
  return sendOk(res, ticket);
}
