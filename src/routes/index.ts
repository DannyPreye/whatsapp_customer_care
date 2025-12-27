import { Router } from 'express';
import health from './health';
import users from './users';
import auth from './auth';
import organizations from './organizations';
import customers from './customers';
import documents from './documents';
import integrations from './integrations';
import webhook from './webhook';
import analytics from './analytics';
import followups from './followups';
import conversations from './conversations';

const router = Router();
router.use('/health', health);
router.use('/users', users);
router.use('/auth', auth);
router.use('/organizations', organizations);
router.use('/', webhook);
router.use('/', customers);
router.use('/', documents);
router.use('/', integrations);
router.use('/', analytics);
router.use('/', followups);
router.use('/', conversations);

export default router;
