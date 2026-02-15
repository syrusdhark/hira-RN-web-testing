import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    TextInput,
    Dimensions,
    ActivityIndicator,
    Platform,
    StatusBar,
    LayoutAnimation,
} from 'react-native';


import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');

export function CartScreen({ navigation }: { navigation: any }) {
    const { items, isLoading, updateQuantity, removeFromCart, totalCount, totalPrice } = useCart();

    const shipping = 0; // Free as per image
    const estimatedTax = totalPrice * 0.08; // Placeholder tax calculation
    const grandTotal = totalPrice + shipping + estimatedTax;

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primaryViolet} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>My Cart ({totalCount})</Text>
                <Pressable>
                    <Text style={styles.helpText}>Help</Text>
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Cart Items */}
                {items.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="cart-off" size={64} color={colors.textTertiary} />
                        <Text style={styles.emptyText}>Your cart is empty</Text>
                        <Pressable style={styles.shopNowButton} onPress={() => navigation.goBack()}>
                            <Text style={styles.shopNowText}>Shop Now</Text>
                        </Pressable>
                    </View>
                ) : (
                    items.map((item) => (
                        <View key={item.id} style={styles.cartItem}>
                            <View style={styles.itemImageContainer}>
                                {item.variant.product.images?.[0] ? (
                                    <Image source={{ uri: item.variant.product.images[0] }} style={styles.itemImage} />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <MaterialCommunityIcons name="image-off" size={24} color={colors.textTertiary} />
                                    </View>
                                )}
                            </View>

                            <View style={styles.itemInfo}>
                                <View style={styles.itemHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemTitle}>{item.variant.product.title}</Text>
                                        <Text style={styles.itemSubtitle}>
                                            {item.variant.product.type === 'digital' ? 'DIGITAL TEMPLATE' : item.variant.title}
                                        </Text>
                                    </View>
                                    <Pressable
                                        onPress={() => {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                            removeFromCart(item.id);
                                        }}
                                        style={styles.deleteButton}
                                    >
                                        <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.textTertiary} />
                                    </Pressable>
                                </View>

                                <View style={styles.itemFooter}>
                                    <Text style={styles.itemPrice}>${item.variant.price_amount.toFixed(2)}</Text>
                                    <View style={styles.quantityControls}>
                                        <Pressable
                                            style={styles.quantityButton}
                                            onPress={() => {
                                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                                updateQuantity(item.id, item.quantity - 1);
                                            }}
                                        >
                                            <MaterialCommunityIcons name="minus" size={16} color={colors.textPrimary} />
                                        </Pressable>
                                        <Text style={styles.quantityText}>{item.quantity}</Text>
                                        <Pressable
                                            style={styles.quantityButton}
                                            onPress={() => {
                                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                                updateQuantity(item.id, item.quantity + 1);
                                            }}
                                        >
                                            <MaterialCommunityIcons name="plus" size={16} color={colors.textPrimary} />
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))
                )}

                {items.length > 0 && (
                    <>
                        {/* Promo Code */}
                        <View style={styles.promoContainer}>
                            <TextInput
                                style={styles.promoInput}
                                placeholder="Enter Promo Code"
                                placeholderTextColor={colors.textTertiary}
                            />
                            <Pressable style={styles.applyButton}>
                                <Text style={styles.applyText}>APPLY</Text>
                            </Pressable>
                        </View>

                        {/* Summary */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal</Text>
                                <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Shipping</Text>
                                <Text style={[styles.summaryValue, { color: colors.healthGreen }]}>Free</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Estimated Tax</Text>
                                <Text style={styles.summaryValue}>${estimatedTax.toFixed(2)}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.totalValue}>${grandTotal.toFixed(2)}</Text>
                                    <Text style={styles.currencyLabel}>USD</Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Checkout Button */}
            {items.length > 0 && (
                <View style={styles.footer}>
                    <Pressable style={styles.checkoutButton}>
                        <Text style={styles.checkoutText}>Checkout</Text>
                        <View style={styles.checkoutPriceBadge}>
                            <Text style={styles.checkoutPriceText}>${grandTotal.toFixed(2)}</Text>
                        </View>
                    </Pressable>
                </View>
            )}

            {/* Floating Action (Mic icon from image) */}
            <Pressable style={styles.floatingMic}>
                <MaterialCommunityIcons name="microphone" size={24} color={colors.textPrimary} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgMidnight,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.bgMidnight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.md,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 60,
        paddingBottom: space.md,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    helpText: {
        fontSize: 14,
        color: colors.textTertiary,
    },
    scrollContent: {
        paddingHorizontal: space.md,
        paddingBottom: 40,
    },
    cartItem: {
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.xl,
        padding: space.md,
        flexDirection: 'row',
        marginBottom: space.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    itemImageContainer: {
        width: 80,
        height: 80,
        borderRadius: radius.lg,
        backgroundColor: colors.bgElevated,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
        marginLeft: space.md,
        justifyContent: 'space-between',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    itemSubtitle: {
        fontSize: 12,
        color: colors.textTertiary,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: space.sm,
    },
    itemPrice: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.primaryViolet,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: radius.full,
        padding: 4,
    },
    quantityButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityText: {
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: '700',
        marginHorizontal: space.md,
    },
    promoContainer: {
        flexDirection: 'row',
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.xl,
        padding: space.md,
        alignItems: 'center',
        marginBottom: space.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    promoInput: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 15,
    },
    applyButton: {
        paddingHorizontal: space.sm,
    },
    applyText: {
        color: colors.primaryViolet,
        fontSize: 14,
        fontWeight: '800',
    },
    summaryCard: {
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.xl,
        padding: space.lg,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: space.sm,
    },
    summaryLabel: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    summaryValue: {
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderSubtle,
        marginVertical: space.md,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    currencyLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    deleteButton: {
        padding: 8,
        marginRight: -8,
        marginTop: -8,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: space.md,
        right: space.md,
    },
    checkoutButton: {
        backgroundColor: '#6C63FF', // Premium violet from image
        height: 60,
        borderRadius: radius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.lg,
    },
    checkoutText: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    checkoutPriceBadge: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        borderRadius: radius.lg,
    },
    checkoutPriceText: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
    },
    floatingMic: {
        position: 'absolute',
        bottom: 110,
        right: space.md,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.bgCharcoal,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: colors.textTertiary,
        fontSize: 18,
        marginTop: space.md,
        marginBottom: space.lg,
    },
    shopNowButton: {
        backgroundColor: colors.primaryViolet,
        paddingHorizontal: space.xl,
        paddingVertical: space.md,
        borderRadius: radius.full,
    },
    shopNowText: {
        color: colors.textPrimary,
        fontWeight: '700',
    },
});
