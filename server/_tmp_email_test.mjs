import { config } from 'dotenv';
config({ path: './.env' });
import { sendAdminNotification } from './src/services/email.service.js';

(async () => {
  try {
    console.log('Testing email send to admin addresses...');
    await sendAdminNotification({
      tenantId: 'test-tenant',
      to: ['karldjansi123@gmail.com', 'djansikarl@gmail.com'],
      subject: 'Test Subscription Renewal Notification',
      templateKey: 'SUBSCRIPTION_RENEWED',
      data: {
        schoolName: 'Test School',
        plan: 'BASIC',
        amount: 2800,
        reference: 'test_ref_123',
        expiresAt: new Date(Date.now() + 31536000000),
      },
    });
    console.log('SUCCESS: Admin notification emails sent!');
  } catch (e) {
    console.log('ERROR:', e.message);
    if (e.response) {
      console.log('Status:', e.response.status);
      console.log('Body:', JSON.stringify(e.response.data || e.response.body).slice(0, 500));
    }
    process.exit(1);
  }
})();
