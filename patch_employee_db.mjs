import { readFileSync, writeFileSync } from 'fs';

const file = '/home/ubuntu/kukbook-erp/server/db.ts';
let content = readFileSync(file, 'utf8');

// Patch createEmployee to accept Indian payroll fields
const oldCreate = `export async function createEmployee(companyId: number, data: { empId: string; name: string; title?: string; dept?: string; type: string; salary: string; rate: string; email?: string; startDate?: string; active: boolean }) {
  const db = await getDb(); if (!db) return;
  await db.insert(employees).values({ ...data, companyId } as any);
}`;

const newCreate = `export async function createEmployee(companyId: number, data: {
  empId: string; name: string; title?: string; dept?: string; type: string; salary: string; rate: string;
  email?: string; startDate?: string; active: boolean;
  basicSalary?: string; hra?: string; da?: string; specialAllowance?: string;
  panNumber?: string; uanNumber?: string; esiNumber?: string; pfOptOut?: boolean;
}) {
  const db = await getDb(); if (!db) return;
  await db.insert(employees).values({
    empId: data.empId, name: data.name, title: data.title, dept: data.dept, type: data.type,
    salary: data.salary, rate: data.rate, email: data.email, startDate: data.startDate, active: data.active,
    basicSalary: data.basicSalary || '0', hra: data.hra || '0', da: data.da || '0', specialAllowance: data.specialAllowance || '0',
    panNumber: data.panNumber || null, uanNumber: data.uanNumber || null, esiNumber: data.esiNumber || null,
    pfOptOut: data.pfOptOut || false,
    companyId
  } as any);
}`;

// Patch updateEmployee to accept Indian payroll fields
const oldUpdate = `export async function updateEmployee(id: number, companyId: number, data: Partial<{ name: string; title: string; dept: string; type: string; salary: string; rate: string; email: string; startDate: string; active: boolean }>) {
  const db = await getDb(); if (!db) return;
  await db.update(employees).set(data as any).where(and(eq(employees.id, id), eq(employees.companyId, companyId)));
}`;

const newUpdate = `export async function updateEmployee(id: number, companyId: number, data: Partial<{
  name: string; title: string; dept: string; type: string; salary: string; rate: string;
  email: string; startDate: string; active: boolean;
  basicSalary: string; hra: string; da: string; specialAllowance: string;
  panNumber: string; uanNumber: string; esiNumber: string; pfOptOut: boolean;
}>) {
  const db = await getDb(); if (!db) return;
  await db.update(employees).set(data as any).where(and(eq(employees.id, id), eq(employees.companyId, companyId)));
}`;

let patched = 0;
if (content.includes(oldCreate)) {
  content = content.replace(oldCreate, newCreate);
  patched++;
  console.log('Patched createEmployee');
} else {
  console.log('createEmployee already patched or not found');
}

if (content.includes(oldUpdate)) {
  content = content.replace(oldUpdate, newUpdate);
  patched++;
  console.log('Patched updateEmployee');
} else {
  console.log('updateEmployee already patched or not found');
}

writeFileSync(file, content, 'utf8');
console.log(`Done: ${patched} functions patched`);
