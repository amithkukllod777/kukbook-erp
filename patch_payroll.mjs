import { readFileSync, writeFileSync } from 'fs';

const file = '/home/ubuntu/kukbook-erp/server/db.ts';
let content = readFileSync(file, 'utf8');

const oldFn = `export async function createPayrollRun(companyId: number, data: { payrollId: string; period: string; runDate: string; gross: string; fedTax: string; stateTax: string; ssMed: string; net: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(payrollRuns).values({ ...data, companyId } as any);
}`;

const newFn = `export async function createPayrollRun(companyId: number, data: {
  payrollId: string; period: string; runDate: string; gross: string; net: string;
  basicPay?: string; hra_amt?: string; da_amt?: string; specialAllow?: string;
  pfEmployee?: string; pfEmployer?: string; esiEmployee?: string; esiEmployer?: string;
  professionalTax?: string; tds?: string;
  fedTax?: string; stateTax?: string; ssMed?: string;
}) {
  const db = await getDb(); if (!db) return;
  await db.insert(payrollRuns).values({
    payrollId: data.payrollId, period: data.period, runDate: data.runDate,
    gross: data.gross, net: data.net,
    basicPay: data.basicPay || '0', hra_amt: data.hra_amt || '0', da_amt: data.da_amt || '0', specialAllow: data.specialAllow || '0',
    pfEmployee: data.pfEmployee || '0', pfEmployer: data.pfEmployer || '0',
    esiEmployee: data.esiEmployee || '0', esiEmployer: data.esiEmployer || '0',
    professionalTax: data.professionalTax || '0', tds: data.tds || '0',
    fedTax: data.fedTax || '0', stateTax: data.stateTax || '0', ssMed: data.ssMed || '0',
    companyId
  } as any);
}`;

if (content.includes(oldFn)) {
  content = content.replace(oldFn, newFn);
  writeFileSync(file, content, 'utf8');
  console.log('Patched createPayrollRun successfully');
} else {
  console.log('Old function not found, may already be patched');
}
