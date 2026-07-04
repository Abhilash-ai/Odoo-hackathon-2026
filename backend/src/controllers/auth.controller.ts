import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/db';
import { sendMail } from '../utils/mailer';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production-123456789';

// Helpers for input validation
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, fullName, email, password, role } = req.body;

    // Field Validation
    if (!employeeId || !fullName || !email || !password || !role) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long' });
      return;
    }

    if (!['ADMIN', 'EMPLOYEE'].includes(role)) {
      res.status(400).json({ message: 'Invalid role. Must be ADMIN or EMPLOYEE' });
      return;
    }

    // Check unique employeeId
    const existingEmployeeId = await prisma.user.findUnique({ where: { employeeId } });
    if (existingEmployeeId) {
      res.status(400).json({ message: 'Employee ID already registered' });
      return;
    }

    // Check unique email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      res.status(400).json({ message: 'Email address already registered' });
      return;
    }

    // Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create User
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          employeeId,
          fullName,
          email,
          passwordHash,
          role,
          verificationToken,
          isEmailVerified: false,
        },
      });

      // Initialize leave balance
      await tx.leaveBalance.create({
        data: {
          userId: newUser.id,
          paid: 12,
          sick: 10,
          casual: 8,
          unpaid: 0,
        },
      });

      return newUser;
    });

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
    await sendMail(
      email,
      'Verify your HRMS Email Address',
      `<p>Hello ${fullName},</p>
       <p>Thank you for registering. Please verify your email by clicking the link below:</p>
       <p><a href="${verifyLink}">${verifyLink}</a></p>
       <p>If you did not request this, please ignore this email.</p>`
    );

    res.status(201).json({
      message: 'Registration successful. A verification email has been sent to your email address.',
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Find User by email or employee ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { employeeId: email }],
      },
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Verify Password
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      res.status(403).json({ message: 'Your account has been suspended. Please contact HR.' });
      return;
    }

    // Create JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return profile data and verification state
    res.status(200).json({
      token,
      user: {
        id: user.id,
        employeeId: user.employeeId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
        phone: user.phone,
        address: user.address,
        profilePhoto: user.profilePhoto,
        emergencyContactName: user.emergencyContactName,
        emergencyContactRelation: user.emergencyContactRelation,
        emergencyContactPhone: user.emergencyContactPhone,
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ message: 'Verification token is required' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired verification token' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
      },
    });

    res.status(200).json({ message: 'Email address verified successfully. You can now login.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({ message: 'Email address is already verified' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: token },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyLink = `${frontendUrl}/verify-email?token=${token}`;
    await sendMail(
      email,
      'Verify your HRMS Email Address',
      `<p>Hello ${user.fullName},</p>
       <p>Please verify your email address by clicking the link below:</p>
       <p><a href="${verifyLink}">${verifyLink}</a></p>`
    );

    res.status(200).json({ message: 'Verification email resent successfully.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      res.status(400).json({ message: 'Valid email is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Return 200 even if user doesn't exist for security reasons (don't leak user list)
      res.status(200).json({ message: 'If that email address exists in our database, we have sent a reset password link.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    await sendMail(
      email,
      'Reset your HRMS Password',
      `<p>Hello ${user.fullName},</p>
       <p>You requested a password reset. Click the link below to set a new password:</p>
       <p><a href="${resetLink}">${resetLink}</a></p>
       <p>This link is valid for 1 hour. If you did not request this, you can ignore this email.</p>`
    );

    res.status(200).json({ message: 'If that email address exists in our database, we have sent a reset password link.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ message: 'Token and new password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired password reset token' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.status(200).json({ message: 'Password has been reset successfully. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
