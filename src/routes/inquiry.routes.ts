import { Router } from 'express';
import { 
  createInquiry, 
  getReceivedInquiries, 
  getSentInquiries 
} from '../controllers/inquiry.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Inquiries
 *   description: Property inquiry APIs
 */
router.use(protect);

/**
 * @swagger
 * /api/inquiries:
 *   post:
 *     summary: Create a new inquiry
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               propertyId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inquiry created successfully
 */
router.post('/', createInquiry);

/**
 * @swagger
 * /api/inquiries/received:
 *   get:
 *     summary: Get all inquiries received by the authenticated user
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of inquiries
 */
router.get('/received', getReceivedInquiries);

/**
 * @swagger
 * /api/inquiries/sent:
 *   get:
 *     summary: Get all inquiries sent by the authenticated user
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of inquiries
 */
router.get('/sent', getSentInquiries);

export default router;
