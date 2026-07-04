import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // Clean old data in dependencies first
  await prisma.attendance.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.payroll.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      employeeId: 'EMP001',
      fullName: 'HR Admin Manager',
      email: 'admin@company.com',
      passwordHash,
      role: 'ADMIN',
      isEmailVerified: true,
      baseSalary: 8000,
      allowances: 1000,
      deductions: 500,
      leaveBalance: {
        create: {
          paid: 12,
          sick: 10,
          casual: 8,
          unpaid: 0,
        },
      },
    },
  });

  // 2. Create Employees
  const emp1 = await prisma.user.create({
    data: {
      employeeId: 'EMP002',
      fullName: 'John Doe',
      email: 'john@company.com',
      passwordHash,
      role: 'EMPLOYEE',
      isEmailVerified: true,
      baseSalary: 5000,
      allowances: 500,
      deductions: 200,
      phone: '+15550199',
      address: '123 Wall Street, NY',
      emergencyContactName: 'Mary Doe',
      emergencyContactRelation: 'Spouse',
      emergencyContactPhone: '+15550198',
      leaveBalance: {
        create: {
          paid: 10,
          sick: 8,
          casual: 6,
          unpaid: 2,
        },
      },
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      employeeId: 'EMP003',
      fullName: 'Jane Smith',
      email: 'jane@company.com',
      passwordHash,
      role: 'EMPLOYEE',
      isEmailVerified: true,
      baseSalary: 6000,
      allowances: 800,
      deductions: 300,
      phone: '+15550244',
      address: '456 Broad Ave, NJ',
      emergencyContactName: 'Robert Smith',
      emergencyContactRelation: 'Father',
      emergencyContactPhone: '+15550245',
      leaveBalance: {
        create: {
          paid: 12,
          sick: 10,
          casual: 8,
          unpaid: 0,
        },
      },
    },
  });

  // 3. Create Announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Quarterly Town Hall Meeting',
        content: 'Join us on Friday at 3:00 PM for our Q3 Town Hall meeting where we will discuss company updates, achievements, and roadmap.',
        authorId: admin.id,
      },
      {
        title: 'New Health Insurance Policy',
        content: 'We have updated our health benefits package. Details have been uploaded to your document folders. Please contact HR for any clarifications.',
        authorId: admin.id,
      },
    ],
  });

  // 4. Create historical attendance for the last 5 weekdays
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // Ignore weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const dateStr = d.toISOString().slice(0, 10);

    const checkInJohn = new Date(d);
    checkInJohn.setHours(9, 0, 0, 0);
    const checkOutJohn = new Date(d);
    checkOutJohn.setHours(17, 0, 0, 0);

    await prisma.attendance.create({
      data: {
        userId: emp1.id,
        date: dateStr,
        checkIn: checkInJohn,
        checkOut: checkOutJohn,
        status: 'PRESENT',
        workingHours: 8.0,
      },
    });

    const checkInJane = new Date(d);
    checkInJane.setHours(9, 30, 0, 0);
    const checkOutJane = new Date(d);
    checkOutJane.setHours(17, 30, 0, 0);

    await prisma.attendance.create({
      data: {
        userId: emp2.id,
        date: dateStr,
        checkIn: checkInJane,
        checkOut: checkOutJane,
        status: 'LATE',
        workingHours: 8.0,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
