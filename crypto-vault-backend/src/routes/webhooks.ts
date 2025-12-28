import { Router, Request, Response } from 'express';
import { circlePaymentsService, tonBridgeService, kycService } from '../services';

const router = Router();

// Circle Payments webhooks
router.post('/circle', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    
    console.log(`Circle webhook received: ${type}`, data);

    switch (type) {
      case 'payment':
        await circlePaymentsService.processPaymentWebhook(data);
        break;
      case 'transfer':
        await circlePaymentsService.processTransferWebhook(data);
        break;
      case 'wallet_creation':
        await circlePaymentsService.processWalletCreationWebhook(data);
        break;
      default:
        console.log(`Unhandled Circle webhook type: ${type}`);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Circle webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Webhook processing failed' 
    });
  }
});

// TON Bridge webhooks
router.post('/ton', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    
    console.log(`TON webhook received: ${type}`, data);

    switch (type) {
      case 'transaction':
        await tonBridgeService.processDepositWebhook(data);
        break;
      case 'withdrawal':
        await tonBridgeService.processWithdrawalWebhook(data);
        break;
      default:
        console.log(`Unhandled TON webhook type: ${type}`);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('TON webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Webhook processing failed' 
    });
  }
});

// KYC webhooks
router.post('/kyc', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    
    console.log(`KYC webhook received: ${type}`, data);

    switch (type) {
      case 'verification_completed':
        await kycService.processKYCWebhook('completed', data);
        break;
      case 'verification_failed':
        await kycService.processKYCWebhook('failed', data);
        break;
      default:
        console.log(`Unhandled KYC webhook type: ${type}`);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('KYC webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Webhook processing failed' 
    });
  }
});

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'Webhook service is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;