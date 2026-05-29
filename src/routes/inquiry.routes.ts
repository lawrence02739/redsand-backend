import { Router } from 'express';
import { 
  createInquiry, 
  getReceivedInquiries, 
  getSentInquiries,
  getAllMyInquiries
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

/**
 * @swagger
 * /api/inquiries/mine:
 *   get:
 *     summary: Get all inquiries (sent and received) by the authenticated user
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by message, property title, or person name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: A paginated list of inquiries
 */
router.get('/mine', getAllMyInquiries);

export default router;
