import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    Platform,
    StatusBar,
    KeyboardAvoidingView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, space, typography } from '../theme';
import { EnvironmentContainer } from '../components/EnvironmentContainer';
import { supabase } from '../lib/supabase';

function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 60;

    async function handleAuth() {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'signup') {
                if (password !== confirmPassword) {
                    Alert.alert('Error', 'Passwords do not match');
                    setLoading(false);
                    return;
                }
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert('Success', 'Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }

    const handleToggle = (targetMode: 'signin' | 'signup') => {
        if (mode === targetMode) return;

        if (targetMode === 'signup') {
            navigation.navigate('SignUp');
        } else {
            // Check if we can go back, otherwise navigate (though in our stack SignIn is root)
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                // If somehow we are at root and want signin, do nothing or specific logic
                // But since SignIn is root, we shouldn't be here if mode is signin.
                // If mode is signup, we go back.
                // Wait, if we are in SignIn and click SignIn, nothing happens.
                // If we are in SignUp (mode='signup') and click SignIn (target='signin'), we goBack.
            }
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: colors.bgMidnight }}
        >
            <EnvironmentContainer>
                <View style={[styles.container, { paddingTop }]}>

                    {/* Logo Section */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoBox}>
                            <MaterialCommunityIcons name="auto-fix" size={32} color={colors.bodyOrange} />
                        </View>
                        <Text style={styles.appName}>Hira AI</Text>
                        <Text style={styles.tagline}>
                            {mode === 'signin'
                                ? 'Your personal AI growth coach'
                                : 'Create your account to start growing'}
                        </Text>
                    </View>

                    {/* Toggle Switch */}
                    <View style={styles.toggleContainer}>
                        <Pressable
                            style={[styles.toggleBtn, mode === 'signin' && styles.toggleBtnActive]}
                            onPress={() => handleToggle('signin')}
                        >
                            <Text style={[styles.toggleText, mode === 'signin' && styles.toggleTextActive]}>Sign In</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.toggleBtn, mode === 'signup' && styles.toggleBtnActive]}
                            onPress={() => handleToggle('signup')}
                        >
                            <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>Sign Up</Text>
                        </Pressable>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <View style={styles.inputWrapper}>
                                <MaterialCommunityIcons name="email-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>EMAIL</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="name@example.com"
                                        placeholderTextColor={colors.textTertiary}
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputWrapper}>
                                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>PASSWORD</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor={colors.textTertiary}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                </View>
                                <Pressable onPress={() => setShowPassword(!showPassword)}>
                                    <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textTertiary} />
                                </Pressable>
                            </View>

                            {mode === 'signup' && (
                                <View style={styles.inputWrapper}>
                                    <MaterialCommunityIcons name="backup-restore" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="••••••••"
                                            placeholderTextColor={colors.textTertiary}
                                            secureTextEntry={!showPassword}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>

                        {mode === 'signin' && (
                            <Pressable style={styles.forgotPass}>
                                <Text style={styles.forgotPassText}>Forgot Password?</Text>
                            </Pressable>
                        )}

                        <Pressable onPress={handleAuth} disabled={loading}>
                            <LinearGradient
                                colors={[colors.primaryViolet, colors.bodyOrange]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                locations={[0, 1]}
                                style={styles.submitButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text style={styles.submitButtonText}>
                                            {mode === 'signin' ? 'Continue' : 'Sign Up'}
                                        </Text>
                                        <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                                    </>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </View>

                    {/* Social Login */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.socialRow}>
                        <Pressable style={styles.socialBtn}>
                            <MaterialCommunityIcons name="google" size={24} color={colors.textPrimary} />
                            <Text style={styles.socialBtnText}>Google</Text>
                        </Pressable>
                        <Pressable style={styles.socialBtn}>
                            <MaterialCommunityIcons name="apple" size={24} color={colors.textPrimary} />
                            <Text style={styles.socialBtnText}>Apple</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.legalText}>
                        By {mode === 'signin' ? 'continuing' : 'signing up'}, you agree to Hira AI's <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
                    </Text>

                </View>
            </EnvironmentContainer>
        </KeyboardAvoidingView>
    );
}

export function SignInScreen() {
    return <AuthForm mode="signin" />;
}

export function SignUpScreen() {
    return <AuthForm mode="signup" />;
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: space.md,
        flex: 1,
        justifyContent: 'center',
        // Ensure content is reasonably centered but scrollable if needed 
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: space['2xl'],
    },
    logoBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#1A1816', // Dark background for logo
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: space.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        // Add subtle glow shadow
        shadowColor: colors.primaryViolet,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    appName: {
        ...typography['2xl'],
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: space.xs,
    },
    tagline: {
        ...typography.base,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: colors.bgElevated,
        borderRadius: 12,
        marginBottom: space.lg,
        padding: 2,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    toggleBtnActive: {
        backgroundColor: colors.borderDefault, // Or a slightly lighter shade for active tab background
    },
    toggleText: {
        ...typography.base,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    toggleTextActive: {
        color: colors.textPrimary,
    },
    formContainer: {
        marginBottom: space.xl,
    },
    inputGroup: {
        gap: space.md,
        marginBottom: space.md,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgElevated,
        borderRadius: radius.xl,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        gap: 12,
    },
    inputIcon: {
        marginTop: 4,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textTertiary,
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    input: {
        color: colors.textPrimary,
        fontSize: 16,
        padding: 0, // Reset default padding
        height: 24,
    },
    forgotPass: {
        alignSelf: 'flex-end',
        marginBottom: space.lg,
    },
    forgotPassText: {
        ...typography.sm,
        color: colors.textSecondary,
    },
    submitButton: {
        height: 56,
        borderRadius: radius['2xl'],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    submitButtonText: {
        ...typography.lg,
        fontWeight: '700',
        color: 'white',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: space.lg,
        gap: space.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.borderDefault,
    },
    dividerText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textTertiary,
        letterSpacing: 1,
    },
    socialRow: {
        flexDirection: 'row',
        gap: space.md,
        marginBottom: space.xl,
    },
    socialBtn: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: colors.bgElevated,
        height: 56,
        borderRadius: radius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    socialBtnText: {
        ...typography.base,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    legalText: {
        ...typography.xs,
        color: colors.textTertiary,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: space.lg,
    },
    linkText: {
        textDecorationLine: 'underline',
        color: colors.textSecondary,
    },
});
