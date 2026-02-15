import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type CartItem = {
    id: string;
    variant_id: string;
    quantity: number;
    variant: {
        id: string;
        title: string;
        price_amount: number;
        product: {
            title: string;
            type: string;
            images: string[];
        };
    };
};

type CartContextType = {
    items: CartItem[];
    isLoading: boolean;
    addToCart: (variantId: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    totalCount: number;
    totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCart = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('shop_cart_items')
            .select(`
        id,
        variant_id,
        quantity,
        variant:shop_variants(
          id,
          title,
          price_amount,
          product:shop_products(
            title,
            type,
            images
          )
        )
      `)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching cart:', error);
        } else {
            setItems((data || []) as any);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCart();

        // Subscribe to cart changes
        const subscription = supabase
            .channel('cart_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_cart_items' }, () => {
                fetchCart();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const addToCart = async (variantId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No user found when adding to cart');
            return;
        }

        const existingIndex = items.findIndex(item => item.variant_id === variantId);
        let newQuantity = 1;

        if (existingIndex > -1) {
            newQuantity = items[existingIndex].quantity + 1;
            const newItems = [...items];
            newItems[existingIndex] = { ...newItems[existingIndex], quantity: newQuantity };
            setItems(newItems);
        }

        const { error } = await supabase
            .from('shop_cart_items')
            .upsert({
                user_id: user.id,
                variant_id: variantId,
                quantity: newQuantity
            }, {
                onConflict: 'user_id,variant_id'
            });

        if (error) {
            console.error('Error adding to cart:', error);
            fetchCart();
        } else {
            fetchCart();
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        if (quantity <= 0) {
            await removeFromCart(itemId);
            return;
        }

        const originalItems = [...items];
        setItems(items.map(item => item.id === itemId ? { ...item, quantity } : item));

        const { error } = await supabase
            .from('shop_cart_items')
            .update({ quantity })
            .eq('id', itemId);

        if (error) {
            console.error('Error updating quantity:', error);
            setItems(originalItems);
        } else {
            fetchCart();
        }
    };

    const removeFromCart = async (itemId: string) => {
        const originalItems = [...items];
        setItems(items.filter(item => item.id !== itemId));

        const { error } = await supabase
            .from('shop_cart_items')
            .delete()
            .eq('id', itemId);

        if (error) {
            console.error('Error removing from cart:', error);
            setItems(originalItems);
        } else {
            fetchCart();
        }
    };

    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => {
        const price = item.variant?.price_amount || 0;
        return sum + (price * item.quantity);
    }, 0);

    return (
        <CartContext.Provider value={{
            items,
            isLoading,
            addToCart,
            updateQuantity,
            removeFromCart,
            totalCount,
            totalPrice
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
