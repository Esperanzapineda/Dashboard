'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import { z } from "zod"

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer'
    }),
    amount: z.coerce
        .number()
        .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoices status.'
    }),
    date: z.string()
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevSate: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.'
        };
    }

    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100; //convertir la cantiad a centavos para eliminar errores de punto flotante
    const date = new Date().toISOString().split('T')[0]; //creemos una nueva fecha con el formato "AAAA-MM-DD" para la fecha de creación de la factura
    try {
        // crear una consulta SQL para insertar la nueva factura en su base de datos y pasar las variables
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    } catch (error) {
        console.error(error);
    }
    //Dado que está actualizando los datos mostrados en la ruta de facturas, desea borrar esta caché y generar una nueva solicitud al servidor.
    //Puede hacerlo con la revalidatePathfunción de Next.js
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices'); //dirigir a invoices al crear la factura
}

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;
    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount=${amountInCents}, status=${status}
            WHERE id = ${id}
        `;
    } catch (error) {
        console.error(error)
    }
    revalidatePath('/dasboard/invoices');
    redirect('/dashboard/invoices')
}

export async function deleteInvoice(id: string) {
    //throw new Error('Failed to Delete Invoice');
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
    } catch (error) {
        console.error(error)
    }
    revalidatePath('/dashboard/invoices');
}