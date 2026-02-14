
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    try {
        const { retentionMonths = 2 } = await request.json();

        // Calculate cutoff date
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);
        const cutoffISO = cutoffDate.toISOString();

        console.log(`Starting photo cleanup. Retention: ${retentionMonths} months. Cutoff: ${cutoffISO}`);

        let deletedFilesCount = 0;
        let updatedSurveysCount = 0;
        let updatedInvoicesCount = 0;

        // ---------------------------------------------------------
        // 1. CLEANUP STORAGE BUCKET (survey_schedules)
        // ---------------------------------------------------------

        // Find surveys older than cutoff with photos
        const { data: oldSurveys, error: fetchError } = await supabaseAdmin
            .from('survey_schedules')
            .select('id, kode_gorden_url, motif_gorden_url')
            .lt('survey_date', cutoffISO)
            .or('kode_gorden_url.neq.null,motif_gorden_url.neq.null');

        if (fetchError) throw fetchError;

        if (oldSurveys && oldSurveys.length > 0) {
            const filesToDelete: string[] = [];
            const surveyIdsToUpdate: string[] = [];

            for (const survey of oldSurveys) {
                if (survey.kode_gorden_url) {
                    const fileName = survey.kode_gorden_url.split('/').pop();
                    if (fileName) filesToDelete.push(fileName);
                }
                if (survey.motif_gorden_url) {
                    const fileName = survey.motif_gorden_url.split('/').pop();
                    if (fileName) filesToDelete.push(fileName);
                }
                surveyIdsToUpdate.push(survey.id);
            }

            // Delete files from Storage
            if (filesToDelete.length > 0) {
                const { data: deleteData, error: deleteError } = await supabaseAdmin
                    .storage
                    .from('survey-photos')
                    .remove(filesToDelete);

                if (deleteError) {
                    console.error("Error deleting files from storage:", deleteError);
                } else {
                    console.log("Deleted files:", deleteData);
                    deletedFilesCount = filesToDelete.length;
                }
            }

            // Update database records to nullify photo URLs
            if (surveyIdsToUpdate.length > 0) {
                const { error: updateError, count } = await supabaseAdmin
                    .from('survey_schedules')
                    .update({
                        kode_gorden_url: null,
                        motif_gorden_url: null,
                        updated_at: new Date().toISOString()
                    })
                    .in('id', surveyIdsToUpdate);

                if (updateError) {
                    console.error("Error updating survey records:", updateError);
                } else {
                    updatedSurveysCount = surveyIdsToUpdate.length;
                }
            }
        }

        // ---------------------------------------------------------
        // 2. CLEANUP DB STORAGE (invoices JSONB)
        // ---------------------------------------------------------

        // Fetch old invoices that might have base64 photos in details
        // Note: checking created_at for invoices
        const { data: oldInvoices, error: invoiceError } = await supabaseAdmin
            .from('invoices')
            .select('id, details')
            .lt('created_at', cutoffISO);

        if (invoiceError) throw invoiceError;

        if (oldInvoices && oldInvoices.length > 0) {
            for (const invoice of oldInvoices) {
                const details = invoice.details as any;
                let needsUpdate = false;

                if (details?.kodeGordenPhoto) {
                    delete details.kodeGordenPhoto;
                    needsUpdate = true;
                }
                if (details?.motifGordenPhoto) {
                    delete details.motifGordenPhoto;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    const { error: updateInvError } = await supabaseAdmin
                        .from('invoices')
                        .update({ details: details }) // Save back the modified JSON
                        .eq('id', invoice.id);

                    if (!updateInvError) {
                        updatedInvoicesCount++;
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Cleanup successful. Deleted ${deletedFilesCount} files, updated ${updatedSurveysCount} surveys, cleaned ${updatedInvoicesCount} invoices.`,
            stats: {
                deletedFiles: deletedFilesCount,
                updatedSurveys: updatedSurveysCount,
                cleanedInvoices: updatedInvoicesCount
            }
        });

    } catch (error: any) {
        console.error('Photo cleanup error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
