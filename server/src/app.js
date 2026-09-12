/**
 * app.js — Express application setup.
 */

import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes         from './routes/auth.routes.js';
import tenantRoutes       from './routes/tenant.routes.js';
import studentRoutes      from './routes/student.routes.js';
import attendanceRoutes   from './routes/attendance.routes.js';
import feeRoutes          from './routes/fee.routes.js';
import gradeRoutes        from './routes/grade.routes.js';
import reportcardRoutes   from './routes/reportcard.routes.js';
import communicationRoutes from './routes/communication.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import staffRoutes        from './routes/staff.routes.js';
import subjectRoutes      from './routes/subject.routes.js';
import profileRoutes      from './routes/profile.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Paystack webhook needs raw body for signature verification
app.use('/api/v1/subscriptions/webhook', express.raw({ type: '*/*' }));

app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth',           authRoutes);
app.use('/api/v1/tenants',        tenantRoutes);
app.use('/api/v1/students',       studentRoutes);
app.use('/api/v1/attendance',     attendanceRoutes);
app.use('/api/v1/fees',           feeRoutes);
app.use('/api/v1/grades',         gradeRoutes);
app.use('/api/v1/report-cards',   reportcardRoutes);
app.use('/api/v1/communications', communicationRoutes);
app.use('/api/v1/subscriptions',  subscriptionRoutes);
app.use('/api/v1/staff-members',  staffRoutes);
app.use('/api/v1/subjects',       subjectRoutes);
app.use('/api/v1/profile',        profileRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorMiddleware);

export default app;
