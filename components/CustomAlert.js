import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { UI_CONSTANTS, COMMON_STYLES, UI_UTILS } from '../utils/uiConstants';

const { width } = Dimensions.get('window');

const CustomAlert = ({ 
  visible, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  onConfirm, 
  onCancel,
  confirmText,
  cancelText,
  showCancel = false,
  onClose
}) => {
  const { t } = useTranslation();
  
  // Use translations if no custom text provided
  const finalConfirmText = confirmText || t('common.ok');
  const finalCancelText = cancelText || t('common.cancel');
  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      default:
        return '#003667';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#E8F5E8';
      case 'error':
        return '#FFEBEE';
      case 'warning':
        return '#FFF3E0';
      default:
        return '#E3F2FD';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.alertContainer, { backgroundColor: getBackgroundColor() }]}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons 
              name={getIconName()} 
              size={48} 
              color={getIconColor()} 
            />
          </View>

          {/* Title */}
          <Text 
            style={styles.title}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </Text>

          {/* Message */}
          <Text 
            style={styles.message}
            numberOfLines={4}
            ellipsizeMode="tail"
          >
            {message}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {showCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
              >
                <Text 
                  style={styles.cancelButtonText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {finalCancelText}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button, 
                styles.confirmButton,
                { backgroundColor: getIconColor() },
                !showCancel && { flex: 1 }
              ]}
              onPress={onConfirm}
            >
              <Text 
                style={styles.confirmButtonText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {finalConfirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
  },
  alertContainer: {
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: UI_CONSTANTS.CARD_BORDER_RADIUS,
    padding: UI_CONSTANTS.SPACING.XXL,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: UI_CONSTANTS.SPACING.LG,
  },
  title: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: 'bold',
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  message: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: UI_CONSTANTS.SPACING.XXL,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: UI_CONSTANTS.SPACING.MD,
  },
  button: {
    flex: 1,
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    paddingHorizontal: UI_CONSTANTS.SPACING.XXL,
    borderRadius: UI_CONSTANTS.SPACING.SM,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: UI_CONSTANTS.BUTTON_HEIGHT_SM,
  },
  confirmButton: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
  },
  confirmButtonText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '600',
  },
});

export default CustomAlert; 