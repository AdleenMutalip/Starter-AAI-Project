// Seeds the six demo users from docs/specs/02-design.md Reference B
// (document §7.2), all logging in with password123 stored as a bcrypt hash,
// and the five leave types of Reference C.
// Safe to re-run: each row is upserted by its unique key.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

type DemoUser = {
  name: string;
  icNumber: string;
  email: string;
  role: string;
  division: string;
  designation: string;
};

// Document §7.2 "Demo people". The employee and both supervisors share the
// Finance division so the employee can choose either supervisor later.
const DEMO_USERS: DemoUser[] = [
  { name: "Employee 1", icNumber: "00-148888", email: "employee-1@budiman.com", role: "EMPLOYEE", division: "Finance", designation: "Accounts Clerk" },
  { name: "Supervisor 1", icNumber: "00-157777", email: "supervisor-1@budiman.com", role: "SUPERVISOR", division: "Finance", designation: "Finance Manager" },
  { name: "Supervisor 2", icNumber: "00-166666", email: "supervisor-2@budiman.com", role: "SUPERVISOR", division: "Finance", designation: "Accountant" },
  { name: "HR 1", icNumber: "00-175555", email: "hr-1@budiman.com", role: "HR", division: "Human Resources", designation: "HR Officer" },
  { name: "HR 2", icNumber: "00-184444", email: "hr-2@budiman.com", role: "HR", division: "Human Resources", designation: "HR Officer" },
  { name: "Admin", icNumber: "00-193333", email: "admin@budiman.com", role: "ADMIN", division: "Admin", designation: "Admin Manager" },
];

// Document §7.2 "Leave types" (design leave Reference C). No demo requests are
// seeded — the acceptance checks create their own data.
const LEAVE_TYPE_NAMES = [
  "Annual leave",
  "Maternity leave",
  "Unpaid leave",
  "Compassionate leave",
  "Other",
];

const SHARED_PASSWORD = "password123";

async function main() {
  const passwordHash = bcrypt.hashSync(SHARED_PASSWORD, 10);
  for (const user of DEMO_USERS) {
    await db.user.upsert({
      where: { email: user.email },
      update: { ...user, passwordHash },
      create: { ...user, passwordHash },
    });
  }
  for (const name of LEAVE_TYPE_NAMES) {
    await db.leaveType.upsert({ where: { name }, update: {}, create: { name } });
  }
  const count = await db.user.count();
  const typeCount = await db.leaveType.count();
  console.log(
    `Seeded ${DEMO_USERS.length} demo users (Users table now has ${count}) and ${LEAVE_TYPE_NAMES.length} leave types (LeaveType table now has ${typeCount}).`
  );
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
