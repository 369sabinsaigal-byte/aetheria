import { Request, Response } from 'express';
import { stripeService } from '../services/stripeIssuing';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CardController {
  // POST /api/cards/issue
  static async issueCard(req: Request, res: Response) {
    try {
      const { userId, type } = req.body;
      
      // Basic validation
      if (!userId) {
        return res.status(400).json({ error: 'UserId is required' });
      }

      // Check if user exists (or create mock user if not for testing)
      let user = await prisma.user.findUnique({ where: { telegramId: userId } });
      if (!user) {
        // Create a mock user for the demo to work without full auth flow
        user = await prisma.user.create({
          data: {
            telegramId: userId,
            firstName: 'Demo',
            lastName: 'User'
          }
        });
      }

      const card = await stripeService.issueVirtualCard(user.id);
      res.json(card);
    } catch (error: any) {
      console.error('Issue Card Error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/cards/:userId
  static async getUserCards(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      // Resolve telegramId to internal ID
      const user = await prisma.user.findUnique({ where: { telegramId: userId } });
      if (!user) return res.json([]);

      const cards = await prisma.card.findMany({
        where: { userId: user.id }
      });
      res.json(cards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/cards/:cardId/freeze
  static async freezeCard(req: Request, res: Response) {
    try {
      const { cardId } = req.params;
      const { frozen } = req.body;
      const card = await stripeService.freezeCard(cardId, frozen);
      res.json(card);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/cards/payment-status
  static async getPaymentStatus(req: Request, res: Response) {
    // Mock response for the frontend check
    res.json({ hasPaid: true });
  }

  // POST /api/cards/payment
  static async processPayment(req: Request, res: Response) {
    // Mock payment processing
    res.json({ success: true, message: 'Payment processed successfully' });
  }

  // POST /api/cards/create
  // This matches the endpoint used in the frontend's AetheriaCard.tsx
  static async createCardLegacy(req: Request, res: Response) {
    // This is a wrapper to handle the frontend's specific call structure
    // Frontend calls this after payment
    // It expects { currency, initialBalance } in body
    // And assumes the user is authenticated via token
    
    // For demo purposes, we'll assume a fixed user ID or extract from token middleware if we had it.
    // Here we'll just call the issue logic with a mock ID.
    const mockUserId = 'demo-user-1'; 
    
    // Check/Create mock user
    let user = await prisma.user.findUnique({ where: { telegramId: mockUserId } });
    if (!user) {
      user = await prisma.user.create({ data: { telegramId: mockUserId } });
    }

    const card = await stripeService.issueVirtualCard(user.id);
    res.json(card);
  }
}
