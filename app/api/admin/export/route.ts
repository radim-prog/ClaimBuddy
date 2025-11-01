import { NextRequest } from 'next/server';
import { requireAdminOrAgent, errorResponse } from '@/lib/api-helpers';
import { adminDb } from '@/lib/firebase/admin';
import { exportDataSchema } from '@/lib/validations/admin';
import { Case, User, Payment } from '@/types';

// Helper function to escape CSV values and prevent injection
function escapeCsvValue(value: any): string {
  let str = String(value || '');

  // CSV Injection Prevention: Escape formula characters
  // If value starts with =, +, -, @ it could be interpreted as formula in Excel/Sheets
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    str = "'" + str; // Prefix with single quote to treat as text
  }

  // Escape quotes (standard CSV escaping)
  str = str.replace(/"/g, '""');

  return `"${str}"`;
}

// Helper function to convert data to CSV
function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return escapeCsvValue(value);
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminOrAgent(request);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = exportDataSchema.parse(body);

    const { type, filters } = validatedData;

    let csvData = '';
    let filename = '';

    if (type === 'cases') {
      // Export cases
      let query = adminDb.collection('cases');

      if (filters?.status) {
        query = query.where('status', '==', filters.status) as any;
      }

      if (filters?.agentId) {
        query = query.where('assignedTo', '==', filters.agentId) as any;
      }

      const snapshot = await query.get();
      let cases = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Case[];

      // Apply date filters
      if (filters?.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        cases = cases.filter(c => {
          const createdAt = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
          return createdAt >= fromDate;
        });
      }

      if (filters?.dateTo) {
        const toDate = new Date(filters.dateTo);
        cases = cases.filter(c => {
          const createdAt = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
          return createdAt <= toDate;
        });
      }

      // Prepare data for CSV
      const csvRows = cases.map(c => ({
        caseNumber: c.caseNumber,
        status: c.status,
        insuranceType: c.insuranceType,
        insuranceCompany: c.insuranceCompany,
        policyNumber: c.policyNumber || '',
        claimAmount: c.claimAmount,
        incidentDate: c.incidentDate,
        incidentLocation: c.incidentLocation,
        assignedTo: c.assignedToName || '',
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : new Date(c.createdAt).toISOString(),
        updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : new Date(c.updatedAt).toISOString(),
        closedAt: c.closedAt ? (c.closedAt instanceof Date ? c.closedAt.toISOString() : new Date(c.closedAt).toISOString()) : '',
      }));

      csvData = convertToCSV(csvRows, [
        'caseNumber',
        'status',
        'insuranceType',
        'insuranceCompany',
        'policyNumber',
        'claimAmount',
        'incidentDate',
        'incidentLocation',
        'assignedTo',
        'createdAt',
        'updatedAt',
        'closedAt',
      ]);

      filename = `cases_export_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'users') {
      // Export users
      let query = adminDb.collection('users');

      const snapshot = await query.get();
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      // Prepare data for CSV
      const csvRows = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        role: u.role,
        createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : new Date(u.createdAt).toISOString(),
        emailVerified: u.emailVerified ? 'Yes' : 'No',
      }));

      csvData = convertToCSV(csvRows, [
        'id',
        'name',
        'email',
        'phone',
        'role',
        'createdAt',
        'emailVerified',
      ]);

      filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'analytics') {
      // Export analytics summary
      const casesSnapshot = await adminDb.collection('cases').get();
      const cases = casesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Case[];

      const paymentsSnapshot = await adminDb.collection('payments').get();
      const payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Payment[];

      const stats = {
        totalCases: cases.length,
        activeCases: cases.filter(c => !['resolved', 'closed'].includes(c.status)).length,
        resolvedCases: cases.filter(c => c.status === 'resolved').length,
        closedCases: cases.filter(c => c.status === 'closed').length,
        totalRevenue: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0),
        avgClaimAmount: cases.length > 0 ? cases.reduce((sum, c) => sum + (c.claimAmount || 0), 0) / cases.length : 0,
      };

      csvData = convertToCSV([stats], [
        'totalCases',
        'activeCases',
        'resolvedCases',
        'closedCases',
        'totalRevenue',
        'avgClaimAmount',
      ]);

      filename = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Return CSV as download
    return new Response(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting data:', error);
    if (error.message === 'Unauthorized' || error.message === 'Admin or Agent access required') {
      return errorResponse(error.message, 403);
    }
    if (error.name === 'ZodError') {
      return errorResponse('Neplatná data', 400);
    }
    return errorResponse('Chyba při exportu dat', 500);
  }
}
