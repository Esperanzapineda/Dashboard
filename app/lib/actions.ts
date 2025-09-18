'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import { z } from "zod"

const sql = postgres(process.env.POSTGRES_URL!, {ssl: 'require'});

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string()
});

const CreateInvoice = FormSchema.omit({ id: true, date: true});

export async function createInvoice(formData: FormData){
    const {customerId, amount, status} =  CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents = amount * 100; //convertir la cantiad a centavos para eliminar errores de punto flotante
    const date = new Date().toISOString().split('T')[0]; //creemos una nueva fecha con el formato "AAAA-MM-DD" para la fecha de creación de la factura

    // crear una consulta SQL para insertar la nueva factura en su base de datos y pasar las variables
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;

    //Dado que está actualizando los datos mostrados en la ruta de facturas, desea borrar esta caché y generar una nueva solicitud al servidor.
    //Puede hacerlo con la revalidatePathfunción de Next.js
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices'); //dirigir a invoices al crear la factura
}