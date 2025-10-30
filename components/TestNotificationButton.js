import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import fcmService from '../services/FCMService';
import { UI_CONSTANTS } from '../utils/uiConstants';

const TestNotificationButton = () => {
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    const handleTestNotification = async () => {
        try {
            setLoading(true);
            console.log('🧪 Sending test notification...');
            
            const result = await fcmService.sendTestNotification();
            
            console.log('✅ Test notification sent successfully:', result);
            Alert.alert(
                t('common.success') || 'Success', 
                'Test notification sent successfully!'
            );
        } catch (error) {
            console.error('❌ Error sending test notification:', error);
            Alert.alert(
                t('common.error') || 'Error', 
                error.message || 'Failed to send test notification'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleTestNotification}
            disabled={loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
                <Text style={styles.buttonText}>
                    Send Test Notification
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: UI_CONSTANTS.COLORS.PRIMARY || '#007AFF',
        padding: UI_CONSTANTS.SPACING.MD || 16,
        borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD || 8,
        alignItems: 'center',
        margin: UI_CONSTANTS.SPACING.MD || 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: UI_CONSTANTS.COLORS.DISABLED || '#CCCCCC',
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: UI_CONSTANTS.FONT_SIZES.MD || 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default TestNotificationButton;
