import { supabase } from "@/lib/supabase";

export interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    unit: string;
}

// Get all products
export async function getProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name');

        if (error) throw error;
        return { success: true, data: data as Product[] };
    } catch (err: any) {
        console.error('Error fetching products:', err);
        return { success: false, error: err.message };
    }
}

// Add new product
export async function addProduct(product: Omit<Product, 'id'>) {
    try {
        const { data, error } = await supabase
            .from('products')
            .insert(product)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        console.error('Error adding product:', err);
        return { success: false, error: err.message };
    }
}

// Update product price (or other fields)
export async function updateProduct(id: number, updates: Partial<Product>) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) {
            throw new Error("Gagal update: Data tidak tersimpan (Cek RLS/Permission).");
        }

        return { success: true };
    } catch (err: any) {
        console.error('Error updating product:', err);
        return { success: false, error: err.message };
    }
}

// Delete product
export async function deleteProduct(id: number) {
    try {
        const { data, error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) {
            throw new Error("Gagal menghapus: Data tidak ditemukan atau izin ditolak (Cek RLS).");
        }
        return { success: true };
    } catch (err: any) {
        console.error('Error deleting product:', err);
        return { success: false, error: err.message };
    }
}
