import React, { useState } from 'react';
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
    LayoutAnimation,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { useShopProducts, useFeaturedProducts, useShopCategories } from '../hooks/useShopProducts';
import { useUserStreaks } from '../hooks/useUserStreaks';
import { useCart } from '../context/CartContext';


const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - space.md * 3) / 2;

type TabType = 'all' | 'templates' | 'supplements';

export function ShopHomeScreen({ onNavigateToCart }: { onNavigateToCart?: () => void }) {
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const { addToCart } = useCart();

    const { data: categories, isLoading: categoriesLoading } = useShopCategories();
    const { data: featuredProducts, isLoading: featuredLoading } = useFeaturedProducts();
    const { data: allProducts, isLoading: productsLoading } = useShopProducts();
    const { data: streaks = [], isLoading: streaksLoading } = useUserStreaks();
    const mainStreak = streaks.find((s) => s.streak_type === 'workout' || s.streak_type === 'overall');
    const streakBadgeValue = streaksLoading ? '--' : String(mainStreak?.current_streak ?? 0);

    const filteredProducts = React.useMemo(() => {
        if (!allProducts) return [];

        let filtered = allProducts;

        // Filter by tab
        if (activeTab === 'templates') {
            filtered = filtered.filter(p => p.type === 'digital');
        } else if (activeTab === 'supplements') {
            filtered = filtered.filter(p => p.type === 'physical');
        }

        // Filter by search
        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    }, [allProducts, activeTab, searchQuery]);

    return (
        <View style={styles.container}>
            <ScreenHeader
                rightBadges={[
                    { value: streakBadgeValue, accent: 'amber' },
                ]}
                onNavigateToCart={onNavigateToCart}
            />

            {/* Static Search Bar */}
            <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for gear, plans..."
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <Pressable style={styles.filterButton}>
                    <MaterialCommunityIcons name="tune-variant" size={20} color={colors.primaryViolet} />
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContainer}
                >
                    <TabButton
                        label="All"
                        isActive={activeTab === 'all'}
                        onPress={() => setActiveTab('all')}
                    />
                    <TabButton
                        label="Workouts"
                        isActive={activeTab === 'templates'}
                        onPress={() => setActiveTab('templates')}
                    />
                    <TabButton
                        label="Supplements"
                        isActive={activeTab === 'supplements'}
                        onPress={() => setActiveTab('supplements')}
                    />
                </ScrollView>

                {/* Featured Section */}
                {featuredProducts && featuredProducts.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Featured</Text>
                        </View>

                        {featuredLoading ? (
                            <ActivityIndicator color={colors.primaryViolet} />
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.featuredScroll}
                            >
                                {featuredProducts.map((product) => (
                                    <FeaturedCard key={product.id} product={product} />
                                ))}
                            </ScrollView>
                        )}
                    </>
                )}

                {/* Trending Now */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Trending Now</Text>
                    <Pressable>
                        <Text style={styles.seeAll}>See All</Text>
                    </Pressable>
                </View>

                {productsLoading ? (
                    <ActivityIndicator color={colors.primaryViolet} style={{ marginTop: space.xl }} />
                ) : (
                    <View style={styles.productsGrid}>
                        {filteredProducts.slice(0, 4).map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={() => {
                                    const variantId = product.variants?.[0]?.id;
                                    if (variantId) {
                                        addToCart(variantId);
                                    } else {
                                        console.warn('Product has no variants:', product.title);
                                    }
                                }}
                            />
                        ))}
                    </View>
                )}

                {/* Gear & Supplements */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Gear & Supplements</Text>
                    <Pressable>
                        <Text style={styles.seeAll}>See All</Text>
                    </Pressable>
                </View>

                <View style={styles.productsGrid}>
                    {filteredProducts
                        .filter(p => p.type === 'physical')
                        .slice(0, 4)
                        .map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={() => {
                                    const variantId = product.variants?.[0]?.id;
                                    if (variantId) {
                                        addToCart(variantId);
                                    } else {
                                        console.warn('Product has no variants:', product.title);
                                    }
                                }}
                            />
                        ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

function TabButton({
    label,
    isActive,
    onPress,
}: {
    label: string;
    isActive: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={onPress}
        >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {label}
            </Text>
        </Pressable>
    );
}

function FeaturedCard({ product }: { product: any }) {
    const variant = product.variants?.[0];
    const price = variant?.price_amount || 0;
    const image = product.images?.[0];

    return (
        <Pressable style={styles.featuredCard}>
            <LinearGradient
                colors={['#1a3a2e', '#0d1f1a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featuredGradient}
            >
                {image && (
                    <Image source={{ uri: image }} style={styles.featuredImage} />
                )}
                <View style={styles.featuredContent}>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                        {product.title}
                    </Text>
                    <View style={styles.featuredFooter}>
                        <Text style={styles.featuredPrice}>${price.toFixed(2)}</Text>
                        <Pressable style={styles.viewPlanButton}>
                            <Text style={styles.viewPlanText}>View Plan</Text>
                            <MaterialCommunityIcons name="arrow-right" size={14} color={colors.textPrimary} />
                        </Pressable>
                    </View>
                </View>
            </LinearGradient>
        </Pressable>
    );
}


function ProductCard({ product, onAddToCart }: { product: any, onAddToCart: () => void }) {
    const [isAdded, setIsAdded] = useState(false);
    const variant = product.variants?.[0];
    const price = variant?.price_amount || 0;
    const image = product.images?.[0];
    const rating = 4.8; // Placeholder

    const handleAdd = async () => {
        if (isAdded) return;

        try {
            await onAddToCart();
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsAdded(true);
            setTimeout(() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsAdded(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to add to cart:', error);
        }
    };

    return (
        <Pressable style={styles.productCard}>
            <View style={styles.productImageContainer}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.productImage} />
                ) : (
                    <View style={[styles.productImage, styles.productImagePlaceholder]}>
                        <MaterialCommunityIcons name="image-off" size={32} color={colors.textTertiary} />
                    </View>
                )}
                <Pressable style={styles.favoriteButton}>
                    <MaterialCommunityIcons name="heart-outline" size={18} color={colors.textPrimary} />
                </Pressable>
            </View>

            <View style={styles.productInfo}>
                <View style={styles.productRating}>
                    <MaterialCommunityIcons name="star" size={12} color={colors.actionAmber} />
                    <Text style={styles.ratingText}>{rating}</Text>
                </View>
                <Text style={styles.productTitle} numberOfLines={2}>
                    {product.title}
                </Text>
                <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>${price.toFixed(2)}</Text>
                    <Pressable
                        style={[styles.addButton, isAdded && styles.addButtonSuccess]}
                        onPress={handleAdd}
                    >
                        <MaterialCommunityIcons
                            name={isAdded ? "check" : "plus"}
                            size={16}
                            color={isAdded ? colors.healthGreen : colors.primaryViolet}
                        />
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgMidnight,
    },
    scrollContent: {
        paddingBottom: space.xl,
        paddingHorizontal: 0, // Remove default padding for full-width control
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCharcoal,
        marginHorizontal: space.md,
        marginTop: space.sm, // Add space after header removal
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: space.md,
    },
    searchInput: {
        flex: 1,
        marginLeft: space.sm,
        color: colors.textPrimary,
        fontSize: 15,
    },
    filterButton: {
        padding: space.xs,
    },
    tabsContainer: {
        paddingHorizontal: space.md,
        gap: space.sm,
        marginBottom: space.lg,
    },
    tab: {
        paddingHorizontal: space.lg,
        paddingVertical: space.sm,
        borderRadius: radius.full,
        backgroundColor: colors.bgCharcoal,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    tabActive: {
        backgroundColor: colors.primaryViolet,
        borderColor: colors.primaryViolet,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    tabTextActive: {
        color: colors.textPrimary,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: space.md,
        marginBottom: space.md,
        marginTop: space.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primaryViolet,
    },
    featuredScroll: {
        paddingHorizontal: space.md,
        gap: space.md,
        marginBottom: space.md,
    },
    featuredCard: {
        width: SCREEN_WIDTH * 0.7,
        height: 200,
        borderRadius: radius.xl,
        overflow: 'hidden',
    },
    featuredGradient: {
        flex: 1,
        padding: space.lg,
        justifyContent: 'space-between',
    },
    featuredImage: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '50%',
        height: '100%',
        opacity: 0.3,
    },
    featuredContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    featuredTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: space.sm,
    },
    featuredFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    featuredPrice: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.healthGreen,
    },
    viewPlanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        borderRadius: radius.full,
        gap: space.xs,
    },
    viewPlanText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: space.md,
        gap: space.md,
    },
    productCard: {
        width: CARD_WIDTH,
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        overflow: 'hidden',
    },
    productImageContainer: {
        position: 'relative',
        width: '100%',
        height: CARD_WIDTH,
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    productImagePlaceholder: {
        backgroundColor: colors.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
    },
    favoriteButton: {
        position: 'absolute',
        top: space.sm,
        right: space.sm,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        padding: space.md,
    },
    productRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    productTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: space.sm,
        height: 36,
    },
    productFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primaryViolet,
    },
    addButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: `${colors.primaryViolet}20`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonSuccess: {
        backgroundColor: `${colors.healthGreen}20`,
        borderColor: colors.healthGreen,
    },
});
