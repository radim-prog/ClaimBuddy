import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { companyId: string } }
) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { companyId } = params;

        if (!companyId) {
            return NextResponse.json(
                { error: 'Company ID is required' },
                { status: 400 }
            );
        }

        const [insurancesResult, assetsResult, employeesResult] = await Promise.all([
            supabaseAdmin
                .from('insurances')
                .select('*')
                .eq('company_id', companyId)
                .order('next_payment_date', { ascending: true }),

            supabaseAdmin
                .from('assets')
                .select('*')
                .eq('company_id', companyId)
                .order('acquisition_date', { ascending: false }),

            supabaseAdmin
                .from('employees')
                .select('*')
                .eq('company_id', companyId)
                .order('last_name', { ascending: true })
        ]);

        if (insurancesResult.error) {
            console.error('Error fetching insurances:', insurancesResult.error);
            return NextResponse.json(
                { error: 'Failed to fetch insurances', details: insurancesResult.error.message },
                { status: 500 }
            );
        }

        if (assetsResult.error) {
            console.error('Error fetching assets:', assetsResult.error);
            return NextResponse.json(
                { error: 'Failed to fetch assets', details: assetsResult.error.message },
                { status: 500 }
            );
        }

        if (employeesResult.error) {
            console.error('Error fetching employees:', employeesResult.error);
            return NextResponse.json(
                { error: 'Failed to fetch employees', details: employeesResult.error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            insurances: insurancesResult.data || [],
            assets: assetsResult.data || [],
            employees: employeesResult.data || []
        });

    } catch (error) {
        console.error('Unexpected error in calendar route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: (error as Error).message },
            { status: 500 }
        );
    }
}
