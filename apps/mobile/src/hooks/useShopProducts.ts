import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type ShopProduct = {
    id: string;
    title: string;
    description: string | null;
    type: 'digital' | 'physical';
    status: 'draft' | 'active' | 'archived';
    images: string[];
    category_id: string | null;
    created_at: string;
    variants: ShopVariant[];
};

export type ShopVariant = {
    id: string;
    product_id: string;
    title: string;
    sku: string | null;
    price_amount: number;
    currency: string;
    compare_at_price: number | null;
    inventory_quantity: number | null;
};

export type ShopCategory = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
};

/**
 * Fetches active shop products with their variants
 */
export function useShopProducts(categorySlug?: string) {
    return useQuery({
        queryKey: ['shop-products', categorySlug],
        queryFn: async () => {
            let query = supabase
                .from('shop_products')
                .select(`
          *,
          variants:shop_variants(*)
        `)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (categorySlug) {
                const { data: category } = await supabase
                    .from('shop_categories')
                    .select('id')
                    .eq('slug', categorySlug)
                    .single();

                if (category) {
                    query = query.eq('category_id', category.id);
                }
            }

            const { data, error } = await query;

            if (error) throw error;
            return (data || []) as ShopProduct[];
        },
    });
}

/**
 * Fetches shop categories
 */
export function useShopCategories() {
    return useQuery({
        queryKey: ['shop-categories'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('shop_categories')
                .select('*')
                .order('name');

            if (error) throw error;
            return (data || []) as ShopCategory[];
        },
    });
}

/**
 * Fetches featured products (first 3 active products)
 */
export function useFeaturedProducts() {
    return useQuery({
        queryKey: ['shop-featured'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('shop_products')
                .select(`
          *,
          variants:shop_variants(*)
        `)
                .eq('status', 'active')
                .limit(3)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as ShopProduct[];
        },
    });
}
