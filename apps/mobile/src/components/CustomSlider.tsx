import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';

interface CustomSliderProps {
    minimumValue?: number;
    maximumValue?: number;
    step?: number;
    value?: number;
    onValueChange?: (value: number) => void;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbTintColor?: string;
    style?: object;
}

export default function CustomSlider({
    minimumValue = 0,
    maximumValue = 1,
    step = 0,
    value = 0,
    onValueChange,
    minimumTrackTintColor = '#8B5CF6',
    maximumTrackTintColor = '#333',
    thumbTintColor = '#FF5C00',
    style,
}: CustomSliderProps) {
    const trackWidth = useRef(0);
    const trackX = useRef(0);
    const [currentValue, setCurrentValue] = useState(value);

    const clamp = (val: number, min: number, max: number) =>
        Math.min(Math.max(val, min), max);

    const snapToStep = (val: number) => {
        if (step <= 0) return val;
        const snapped = Math.round((val - minimumValue) / step) * step + minimumValue;
        return clamp(snapped, minimumValue, maximumValue);
    };

    const positionToValue = (x: number) => {
        if (trackWidth.current <= 0) return minimumValue;
        const ratio = clamp(x / trackWidth.current, 0, 1);
        const raw = minimumValue + ratio * (maximumValue - minimumValue);
        return snapToStep(raw);
    };

    const valueToRatio = (val: number) => {
        if (maximumValue === minimumValue) return 0;
        return clamp((val - minimumValue) / (maximumValue - minimumValue), 0, 1);
    };

    const handleMove = useCallback(
        (pageX: number) => {
            const x = pageX - trackX.current;
            const newValue = positionToValue(x);
            setCurrentValue(newValue);
            onValueChange?.(newValue);
        },
        [minimumValue, maximumValue, step, onValueChange]
    );

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                handleMove(evt.nativeEvent.pageX);
            },
            onPanResponderMove: (evt) => {
                handleMove(evt.nativeEvent.pageX);
            },
        })
    ).current;

    // Sync external value prop
    React.useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const onTrackLayout = (e: LayoutChangeEvent) => {
        trackWidth.current = e.nativeEvent.layout.width;
        trackX.current = e.nativeEvent.layout.x;
    };

    const onTrackContainerLayout = (e: LayoutChangeEvent) => {
        // We need page-level x, so measure relative to screen
        e.target?.measure?.((_x, _y, _w, _h, pageX) => {
            if (pageX != null) trackX.current = pageX;
        });
    };

    const ratio = valueToRatio(currentValue);
    const THUMB_SIZE = 24;
    const TRACK_HEIGHT = 4;

    return (
        <View
            style={[styles.container, style]}
            onLayout={onTrackContainerLayout}
            {...panResponder.panHandlers}
        >
            <View style={[styles.track, { height: TRACK_HEIGHT }]} onLayout={onTrackLayout}>
                <View
                    style={[
                        styles.trackFilled,
                        {
                            width: `${ratio * 100}%`,
                            backgroundColor: minimumTrackTintColor,
                            height: TRACK_HEIGHT,
                        },
                    ]}
                />
                <View
                    style={[
                        styles.trackEmpty,
                        {
                            flex: 1,
                            backgroundColor: maximumTrackTintColor,
                            height: TRACK_HEIGHT,
                        },
                    ]}
                />
            </View>
            <View
                style={[
                    styles.thumb,
                    {
                        width: THUMB_SIZE,
                        height: THUMB_SIZE,
                        borderRadius: THUMB_SIZE / 2,
                        backgroundColor: thumbTintColor,
                        left: `${ratio * 100}%`,
                        marginLeft: -(THUMB_SIZE / 2),
                    },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 40,
        justifyContent: 'center',
        position: 'relative',
    },
    track: {
        flexDirection: 'row',
        borderRadius: 2,
        overflow: 'hidden',
    },
    trackFilled: {
        borderRadius: 2,
    },
    trackEmpty: {
        borderRadius: 2,
    },
    thumb: {
        position: 'absolute',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
});
