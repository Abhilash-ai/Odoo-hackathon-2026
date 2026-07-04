import fs from 'fs';
import path from 'path';

export const sendMail = async (to: string, subject: string, htmlContent: string): Promise<void> => {
  console.log(`========================================`);
  console.log(`[MOCK EMAIL SENT]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`========================================`);

  const logDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, 'mail-logs.txt');
  const logEntry = `[${new Date().toISOString()}] To: ${to} | Subject: ${subject}\nHTML: ${htmlContent}\n----------------------------------------\n`;
  fs.appendFileSync(logFile, logEntry);
};
