import { Router } from 'express';
import { CardController } from '../controllers/cardController';

const router = Router();

router.post('/issue', CardController.issueCard);
router.get('/payment-status', CardController.getPaymentStatus);
router.post('/payment', CardController.processPayment);
router.post('/create', CardController.createCardLegacy); // Support existing frontend call
router.get('/:userId', CardController.getUserCards);
router.post('/:cardId/freeze', CardController.freezeCard);

export default router;
