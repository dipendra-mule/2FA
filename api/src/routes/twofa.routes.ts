// twofa.routes.ts
import { Router } from 'express';
import { setup2FA, verify2FA, validate2FA } from '../controllers/twofa.controller';
import { isAuthenticated } from '../middleware/auth.middleware';

const router = Router();

router.post('/setup', isAuthenticated, setup2FA);
router.post('/verify', isAuthenticated, verify2FA);
router.post('/validate', isAuthenticated, validate2FA);

export default router;
