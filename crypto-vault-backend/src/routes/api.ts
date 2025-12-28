import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { aetheriaCardService, kycService, userService } from '../services';

const router = Router();
const prisma = new PrismaClient();

// Middleware to get user from request (placeholder for auth middleware)
const getUserFromRequest = (req: Request): string => {
  // In a real app, this would extract user ID from JWT or session
  return req.headers['x-user-id'] as string || 'default-user-id';
};

// User routes
router.post('/users/register', async (req: Request, res: Response) => {
  try {
    const { email, phone, walletAddress, referralCode } = req.body;
    const user = await userService.registerUser({
      email,
      phone,
      walletAddress,
      referralCode,
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Registration failed' 
    });
  }
});

router.get('/users/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const profile = await userService.getUserById(userId);
    res.json({ success: true, profile });
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'User not found' 
    });
  }
});

router.put('/users/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { phone, walletAddress, firstName, lastName, dateOfBirth } = req.body;
    const user = await userService.updateUserProfile(userId, {
      phone,
      walletAddress,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Update failed' 
    });
  }
});

router.get('/users/stats', async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const stats = await userService.getUserStats(userId);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Stats not available' 
    });
  }
});

// KYC routes
router.post('/kyc/verify', async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const verificationData = req.body;
    const result = await kycService.submitKYCVerification(userId, verificationData);
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'KYC verification failed' 
    });
  }
});

router.get('/kyc/status', async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const status = await kycService.getKYCStatus(userId);
    res.json({ success: true, status });
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'KYC status not found' 
    });
  }
});

router.get('/kyc/requirements', async (req: Request, res: Response) => {
  try {
    const { country } = req.query;
    const requirements = await kycService.getVerificationRequirements(country as string);
    res.json({ success: true, requirements });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Requirements not available' 
    });
  }
});

// Card routes
router.post('/cards/issue', async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { type, cardholderData, shippingAddress } = req.body;
    const card = await aetheriaCardService.issueCard(userId, type, {
      cardholderData,
      shippingAddress,
    });
    res.json({ success: true, card });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Card issuance failed' 
    });
  }
});

router.get('/cards', async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const cards = await aetheriaCardService.getUserCards(userId);
    res.json({ success: true, cards });
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Cards not found' 
    });
  }
});

router.get('/cards/:cardId', async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const card = await aetheriaCardService.getCard(cardId);
    res.json({ success: true, card });
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Card not found' 
    });
  }
});

router.put('/cards/:cardId/freeze', async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const { frozen } = req.body;
    const card = await aetheriaCardService.freezeCard(cardId, frozen);
    res.json({ success: true, card });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update card freeze status' 
    });
  }
});

router.put('/cards/:cardId/controls', async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const controls = req.body;
    const card = await aetheriaCardService.updateCardControls(cardId, controls);
    res.json({ success: true, card });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update card controls' 
    });
  }
});

router.put('/cards/:cardId/limits', async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const { daily, monthly, singleTransaction } = req.body;
    const card = await aetheriaCardService.setSpendingLimit(cardId, {
      daily,
      monthly,
      singleTransaction,
    });
    res.json({ success: true, card });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update spending limits' 
    });
  }
});

// Balance and funding routes
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { asset } = req.query;
    const balance = await aetheriaCardService.getBalance(userId, asset as string);
    res.json({ success: true, balance });
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Balance not found' 
    });
  }
});

router.get('/cards/:cardId/balance', async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const balance = await aetheriaCardService.getCardBalance(cardId);
    res.json({ success: true, balance });
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Card balance not found' 
    });
  }
});

router.post('/cards/:cardId/topup', async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const { amount, asset } = req.body;
    const result = await aetheriaCardService.topUpFromWallet(cardId, amount, asset);
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Top-up failed' 
    });
  }
});

// Transaction routes
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { type, status, category, startDate, endDate, limit, offset } = req.query;
    
    const filters = {
      type: type as any,
      status: status as any,
      category: category as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const transactions = await aetheriaCardService.getTransactions(filters);
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch transactions' 
    });
  }
});

router.get('/cards/:cardId/transactions', async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const { type, status, category, startDate, endDate, limit, offset } = req.query;
    
    const filters = {
      type: type as any,
      status: status as any,
      category: category as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const transactions = await aetheriaCardService.getCardTransactions(cardId, filters);
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch card transactions' 
    });
  }
});

router.post('/transactions/:transactionId/refund', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { refundAmount } = req.body;
    const result = await aetheriaCardService.refundTransaction(transactionId, refundAmount);
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Refund failed' 
    });
  }
});

// Referral routes
router.post('/referrals', async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { referralCode } = req.body;
    await userService.addReferral(userId, referralCode);
    res.json({ success: true, message: 'Referral added successfully' });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add referral' 
    });
  }
});

router.get('/referrals', async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const referrals = await userService.getUserReferrals(userId);
    res.json({ success: true, referrals });
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Referrals not found' 
    });
  }
});

router.post('/referrals/generate-code', async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const code = await userService.generateReferralCode(userId);
    res.json({ success: true, code });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate referral code' 
    });
  }
});

// Notifications routes
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const notifications = await userService.getUserNotifications(userId);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Notifications not found' 
    });
  }
});

router.put('/notifications/:notificationId/read', async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { notificationId } = req.params;
    await userService.markNotificationAsRead(userId, notificationId);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to mark notification as read' 
    });
  }
});

export default router;