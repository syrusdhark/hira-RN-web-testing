import * as React from 'react';
import type {
    ViewProps,
    ImageProps,
    ScrollViewProps,
    TextProps,
    PressableProps,
    TextInputProps,
    TouchableOpacityProps,
    KeyboardAvoidingViewProps,
    ActivityIndicatorProps,
    ImageBackgroundProps,
    TouchableWithoutFeedbackProps
} from 'react-native';

declare module 'react-native' {
    export const View: React.FC<ViewProps>;
    export const Image: React.FC<ImageProps>;
    export const ScrollView: React.FC<ScrollViewProps>;
    export const Text: React.FC<TextProps>;
    export const Pressable: React.FC<PressableProps>;
    export const TextInput: React.FC<TextInputProps>;
    export const TouchableOpacity: React.FC<TouchableOpacityProps>;
    export const KeyboardAvoidingView: React.FC<KeyboardAvoidingViewProps>;
    export const SafeAreaView: React.FC<ViewProps>;
    export const ActivityIndicator: React.FC<ActivityIndicatorProps>;
    export const ImageBackground: React.FC<ImageBackgroundProps>;
    export const TouchableWithoutFeedback: React.FC<TouchableWithoutFeedbackProps>;
}
