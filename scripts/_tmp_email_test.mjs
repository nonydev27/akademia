import { sendAdminNotification } from '../server/src/services/email.service.js';

(async () => {
  try {
    console.log('Testing email send...');
    await sendAdminNotification({
      tenantId: 'test-tenant',
      to: ['karldjansi123@gmail.com', 'djansikarl@gmail.com'],
      subject: 'Test Notification',
      templateKey: 'TEST',
      data: {
        schoolName: 'Test School',
        plan: 'BASIC',
        amount: 2800,
        reference: 'test_ref_123',
        expiresAt: new Date(Date.now() + 31536000000),
      },
    });
    console.log('SUCCESS: Emails sent (or queued)');
  } catch (e) {
    console.log('ERROR:', e.message);
    if (e.response) {
      console.log('Response:', JSON.stringify(e.response.data || e.response.body).slice(0, 500));
    }
  }
})();
