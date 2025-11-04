import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { UI_CONSTANTS } from '../../utils/uiConstants';
import RNFS from 'react-native-fs';
import jsPDF from 'jspdf';
import Share from 'react-native-share';
import { getServerUrl, getApiHeaders, API_ENDPOINTS } from '../../config/api';
import BannerNotification from '../../components/BannerNotification';

// Responsive UI constants
const RESPONSIVE_CONSTANTS = {
  SPACING: {
    XS: scale(4),
    SM: scale(8),
    MD: scale(12),
    LG: scale(16),
    XL: scale(20),
    XXL: scale(24),
  },
  FONT_SIZES: {
    XS: moderateScale(10),
    SM: moderateScale(12),
    MD: moderateScale(14),
    LG: moderateScale(16),
    XL: moderateScale(18),
    XXL: moderateScale(20),
  },
  CARD_PADDING: scale(16),
  CARD_BORDER_RADIUS: scale(12),
  INPUT_HEIGHT: verticalScale(48),
  BUTTON_HEIGHT: verticalScale(48),
};

const WorkOrderDetailsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { workOrder } = route.params || {};

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [checklistData, setChecklistData] = useState([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [showBannerNotification, setShowBannerNotification] = useState(false);
  const [pdfPath, setPdfPath] = useState(null);

  // Fetch checklist data when checklist tab is active
  useEffect(() => {
    if (activeTab === 'checklist' && workOrder?.assetTypeId && checklistData.length === 0 && !loadingChecklist) {
      fetchChecklistData();
    }
  }, [activeTab, workOrder?.assetTypeId]);

  const fetchChecklistData = async () => {
    if (!workOrder?.assetTypeId) {
      console.warn('No asset type ID available for fetching checklist');
      return;
    }

    try {
      setLoadingChecklist(true);
      const serverUrl = getServerUrl();
      const endpoint = API_ENDPOINTS.GET_CHECKLIST_BY_ASSET_TYPE(workOrder.assetTypeId);
      const url = `${serverUrl}${endpoint}`;

      console.log('Fetching checklist data from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: await getApiHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Checklist API Error:', response.status, errorText);
        // Don't throw error, just log it and show empty state
        setChecklistData([]);
        return;
      }

      const data = await response.json();
      console.log('Checklist data fetched successfully:', data);

      // Handle different response structures
      let checklistArray = [];
      if (data.success && data.data) {
        checklistArray = data.data;
      } else if (data.data && Array.isArray(data.data)) {
        checklistArray = data.data;
      } else if (Array.isArray(data)) {
        checklistArray = data;
      } else {
        console.warn('Unexpected checklist API response structure:', data);
        checklistArray = [];
      }

      setChecklistData(checklistArray);
    } catch (error) {
      console.error('Error fetching checklist data:', error);
      setChecklistData([]);
    } finally {
      setLoadingChecklist(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Refresh checklist if checklist tab is active
    if (activeTab === 'checklist') {
      fetchChecklistData().finally(() => {
        setRefreshing(false);
      });
    } else {
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }
  }, [activeTab]);

  const formatDateOnly = (dateString) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      return dateString.split('T')[0];
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'completed':
      case 'done':
      case 'finished':
        return '#4CAF50';
      case 'in_progress':
      case 'in progress':
      case 'in':
        return '#2196F3';
      case 'pending':
      case 'open':
        return '#FF9800';
      case 'cancelled':
      case 'canceled':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'completed':
      case 'done':
      case 'finished':
        return t('workOrder.statusCompleted');
      case 'in_progress':
      case 'in progress':
      case 'in':
        return t('workOrder.statusInProgress');
      case 'pending':
      case 'open':
        return t('workOrder.statusPending');
      case 'cancelled':
      case 'canceled':
        return t('workOrder.statusCancelled');
      default:
        return status || t('workOrder.statusUnknown');
    }
  };

  const generatePDF = async () => {
    try {
      setIsGeneratingPDF(true);

      // Create new PDF document
      const doc = new jsPDF();

      // Set up colors and fonts
      const primaryColor = [33, 150, 243]; // Blue color
      const textColor = [51, 51, 51]; // Dark gray
      const secondaryColor = [102, 102, 102]; // Light gray

      // Page dimensions (A4: 210mm x 297mm)
      const pageWidth = 210;
      const pageHeight = 297;
      const marginLeft = 15;
      const marginRight = 15;
      const contentWidth = pageWidth - marginLeft - marginRight;
      const labelWidth = 65; // Fixed width for labels for consistent alignment
      const valueStartX = marginLeft + labelWidth + 5; // Start value after label + spacing
      const valueWidth = contentWidth - labelWidth - 5; // Remaining width for values

      // Helper function to add text with word wrapping
      const addText = (text, x, y, maxWidth = contentWidth, fontSize = 10, color = textColor, align = 'left') => {
        if (!text) text = '';
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(String(text), maxWidth);
        
        // Handle alignment
        let alignX = x;
        if (align === 'center') {
          alignX = x + (maxWidth / 2);
          doc.text(lines, alignX, y, { align: 'center' });
        } else if (align === 'right') {
          alignX = x + maxWidth;
          doc.text(lines, alignX, y, { align: 'right' });
        } else {
          doc.text(lines, x, y);
        }
        
        // Return new Y position (using proper line height: fontSize * 0.55 for better spacing)
        const lineHeight = fontSize * 0.55;
        return y + (lines.length * lineHeight);
      };

      // Helper function to add section header
      const addSectionHeader = (text, y) => {
        const headerHeight = 8;
        const headerPadding = 3;
        
        // Draw header background
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(marginLeft, y - headerPadding, contentWidth, headerHeight, 'F');
        
        // Add header text (centered in the header)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        const textY = y + (headerHeight / 2) - 2; // Center vertically in header
        doc.text(text, marginLeft + (contentWidth / 2), textY, { align: 'center' });
        
        // Reset text color and font
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFont(undefined, 'normal');
        
        return y + headerHeight + 8; // Return Y position after header + spacing
      };

      // Helper function to add info row with proper alignment
      const addInfoRow = (label, value, y) => {
        const fontSize = 10;
        const lineHeight = fontSize * 0.55;
        
        // Add label (right-aligned for consistent alignment)
        doc.setFontSize(fontSize);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        const labelText = `${label}:`;
        doc.text(labelText, marginLeft + labelWidth, y, { align: 'right' });
        
        // Add value
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        const valueText = value || 'N/A';
        const valueLines = doc.splitTextToSize(String(valueText), valueWidth);
        doc.text(valueLines, valueStartX, y);
        
        // Calculate new Y position based on which has more lines
        const labelLines = doc.splitTextToSize(labelText, labelWidth).length;
        const maxLines = Math.max(labelLines, valueLines.length);
        
        return y + (maxLines * lineHeight) + 5; // Return Y with proper spacing
      };

      let currentY = 20;

      // Add header - centered title
      currentY = addText('WORK ORDER DETAILS REPORT', marginLeft, currentY, contentWidth, 18, primaryColor, 'center');
      currentY += 6;
      
      // Add generation timestamp - centered
      const timestamp = `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      currentY = addText(timestamp, marginLeft, currentY, contentWidth, 9, secondaryColor, 'center');
      currentY += 12;

      // Add work order info
      currentY = addInfoRow('Work Order ID', workOrder?.id, currentY);
      currentY = addInfoRow('Status', getStatusText(workOrder?.status), currentY);
      currentY += 8;

      // Overview Section
      currentY = addSectionHeader('OVERVIEW', currentY);
      currentY = addInfoRow('Asset ID', workOrder?.assetId, currentY);
      currentY = addInfoRow('Asset Type', workOrder?.assetType, currentY);
      currentY = addInfoRow('Maintenance Date', workOrder?.maintenanceDate ? formatDateOnly(workOrder.maintenanceDate) : null, currentY);
      currentY = addInfoRow('Serial Number', workOrder?.serialNumber || workOrder?.assetName, currentY);
      currentY = addInfoRow('Location', workOrder?.location, currentY);
      currentY = addInfoRow('Current Condition', workOrder?.currentCondition, currentY);
      currentY += 8;

      // Vendor Section
      currentY = addSectionHeader('VENDOR INFORMATION', currentY);
      currentY = addInfoRow('Vendor Name', workOrder?.vendorName || workOrder?.vendor?.name || workOrder?.vendor?.vendor_name || 'N/A', currentY);
      currentY = addInfoRow('Email', workOrder?.vendorEmail || workOrder?.vendor?.email || workOrder?.vendor?.vendor_email || 'N/A', currentY);
      currentY = addInfoRow('Maintenance Type', workOrder?.maintenanceType || 'N/A', currentY);
      currentY = addInfoRow('Contact Person', workOrder?.contactPerson || workOrder?.vendor?.contact_person || workOrder?.vendor?.contact_name || 'N/A', currentY);
      currentY = addInfoRow('Phone', workOrder?.vendorPhone || workOrder?.vendor?.phone || workOrder?.vendor?.vendor_phone || 'N/A', currentY);
      currentY = addInfoRow('Status', getStatusText(workOrder?.status), currentY);
      currentY += 8;

      // Checklist Section - Only show if there's actual checklist data
      if (checklistData && checklistData.length > 0) {
        currentY = addSectionHeader('MAINTENANCE CHECKLIST', currentY);
        
        checklistData.forEach((item) => {
          // Extract the checklist item text from various possible field names
          const itemText = item.item || item.title || item.name || item.checklist_item || 'Checklist Item';
          currentY = addText(`• ${itemText}`, valueStartX, currentY, valueWidth);
          
          // Add description if available
          if (item.description) {
            currentY = addText(`  ${item.description}`, valueStartX + 5, currentY, valueWidth - 5, 9, secondaryColor);
          }
          
          // Add instructions if available
          if (item.instructions) {
            currentY = addText(`  Instructions: ${item.instructions}`, valueStartX + 5, currentY, valueWidth - 5, 9, secondaryColor);
          }
          
          currentY += 4; // Spacing between checklist items
        });
        currentY += 4;
      }

      // History Section
      currentY = addSectionHeader('MAINTENANCE HISTORY', currentY);
      currentY = addInfoRow('Maintenance Activity', '13/10/2025', currentY);
      currentY = addInfoRow('Vendor', 'Ramesh Kishna', currentY);
      currentY = addInfoRow('Maintenance ID', 'ams001', currentY);
      currentY = addInfoRow('Status', t('workOrder.statusInProgress'), currentY);
      currentY += 8;

      // Additional Issues Section (if available)
      if (workOrder?.description || workOrder?.additionalIssues) {
        currentY = addSectionHeader('ADDITIONAL ISSUES', currentY);
        currentY = addText(workOrder?.description || workOrder?.additionalIssues || 'N/A', valueStartX, currentY, valueWidth);
        currentY += 10;
      }

      // Add footer with proper alignment
      // Ensure footer is at least 30mm from bottom or after last content
      const footerStartY = Math.max(currentY + 15, pageHeight - 30);
      doc.setDrawColor(200, 200, 200);
      doc.line(marginLeft, footerStartY, pageWidth - marginRight, footerStartY);
      
      let footerY = footerStartY + 8;
      footerY = addText('Generated by Work Order Management System', marginLeft, footerY, contentWidth, 8, secondaryColor, 'center');
      footerY = addText(`Report Date: ${new Date().toLocaleDateString()}`, marginLeft, footerY, contentWidth, 8, secondaryColor, 'center');

      // Generate PDF file path
      const fileName = `WorkOrder_${workOrder?.id || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfPath = Platform.OS === 'android'
        ? `${RNFS.DownloadDirectoryPath}/${fileName}`
        : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      // Convert PDF to base64 and save
      const pdfOutput = doc.output('datauristring');
      const base64Data = pdfOutput.split(',')[1];

      await RNFS.writeFile(pdfPath, base64Data, 'base64');

      // Store PDF path for banner notification
      setPdfPath(pdfPath);
      
      // Show banner notification
      setShowBannerNotification(true);

      // Also show alert popup
      Alert.alert(
        t('workOrder.pdfGenerated'),
        `${t('workOrder.pdfSavedTo')} ${pdfPath}`,
        [
          {
            text: t('workOrder.ok'),
            style: 'cancel',
          },
        ],
      );
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert(t('workOrder.error'), t('workOrder.pdfGenerationFailed'));
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!workOrder) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={UI_CONSTANTS.COLORS.PRIMARY} />

        {/* AppBar */}
        <View style={styles.appBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FEC200" />
          </TouchableOpacity>
          <View style={styles.centerTitleContainer}>
            <Text
              style={styles.appbarTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('workOrder.details')}
            </Text>
          </View>
          <View style={styles.rightPlaceholder} />
        </View>

        <View style={[styles.errorContainer, { backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND }]}>
          <Text style={styles.errorText}>{t('workOrder.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={UI_CONSTANTS.COLORS.PRIMARY} />

      {/* AppBar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FEC200" />
        </TouchableOpacity>
        <View style={styles.centerTitleContainer}>
          <Text
            style={styles.appbarTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('workOrder.details')}
          </Text>
        </View>
        <View style={styles.rightPlaceholder} />
      </View>

      {/* Export PDF Button */}
      <View style={styles.exportButtonContainer}>
        <TouchableOpacity
          style={[styles.exportButton, isGeneratingPDF && styles.exportButtonDisabled]}
          onPress={generatePDF}
          activeOpacity={0.7}
          disabled={isGeneratingPDF}
        >
          <MaterialCommunityIcons
            name={isGeneratingPDF ? 'loading' : 'file-pdf-box'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.exportButtonText}>
            {isGeneratingPDF ? t('workOrder.generatingPDF') : t('workOrder.exportPdf')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <MaterialCommunityIcons
            name="file-document-outline"
            size={20}
            color={activeTab === 'overview' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            {t('workOrder.tabOverview')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'vendor' && styles.activeTab]}
          onPress={() => setActiveTab('vendor')}
        >
          <MaterialCommunityIcons
            name="domain"
            size={20}
            color={activeTab === 'vendor' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'vendor' && styles.activeTabText]}>
            {t('workOrder.tabVendor')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'checklist' && styles.activeTab]}
          onPress={() => setActiveTab('checklist')}
        >
          <MaterialCommunityIcons
            name="clipboard-list-outline"
            size={20}
            color={activeTab === 'checklist' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'checklist' && styles.activeTabText]}>
            {t('workOrder.tabChecklist')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <MaterialCommunityIcons
            name="history"
            size={20}
            color={activeTab === 'history' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            {t('workOrder.tabHistory')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Banner Notification */}
      <BannerNotification
        visible={showBannerNotification}
        title={t('workOrder.pdfGenerated')}
        message={t('workOrder.tapToOpenPDF') || 'Tap to open PDF'}
        type="success"
        onPress={async () => {
          if (pdfPath) {
            try {
              // Check if file exists
              const fileExists = await RNFS.exists(pdfPath);
              if (fileExists) {
                if (Platform.OS === 'android') {
                  // For Android, use react-native-share to open/view PDF
                  // This will show a share sheet with apps that can view PDFs
                  try {
                    const shareOptions = {
                      url: `file://${pdfPath}`,
                      type: 'application/pdf',
                      filename: pdfPath.split('/').pop(), // Extract filename
                    };
                    await Share.open(shareOptions);
                  } catch (shareError) {
                    // User might have cancelled the share sheet - that's okay
                    // Check if it's a cancellation vs actual error
                    const errorMessage = shareError?.message || String(shareError);
                    if (
                      !errorMessage.includes('User did not share') &&
                      !errorMessage.includes('User cancelled') &&
                      !errorMessage.includes('userCancel')
                    ) {
                      console.error('Share error:', shareError);
                      // If share fails, inform user they can manually open from Downloads
                      Alert.alert(
                        t('workOrder.error'),
                        `${t('workOrder.failedToOpenPDF')}\n\n${t('workOrder.pdfSavedTo')} ${pdfPath.split('/').pop()}`
                      );
                    }
                    // If user cancelled, just silently dismiss
                  }
                } else {
                  // For iOS, use Share.open which handles file URIs better
                  try {
                    await Share.open({
                      url: `file://${pdfPath}`,
                      type: 'application/pdf',
                    });
                  } catch (shareError) {
                    const errorMessage = shareError?.message || String(shareError);
                    if (
                      !errorMessage.includes('User did not share') &&
                      !errorMessage.includes('User cancelled') &&
                      !errorMessage.includes('userCancel')
                    ) {
                      console.error('Error opening PDF on iOS:', shareError);
                      Alert.alert(
                        t('workOrder.error'),
                        t('workOrder.failedToOpenPDF')
                      );
                    }
                  }
                }
              } else {
                Alert.alert(
                  t('workOrder.error'),
                  t('workOrder.pdfFileNotFound')
                );
              }
            } catch (error) {
              console.error('Error opening PDF:', error);
              Alert.alert(
                t('workOrder.error'),
                t('workOrder.failedToOpenPDF')
              );
            }
          }
        }}
        onDismiss={() => {
          setShowBannerNotification(false);
          setPdfPath(null);
        }}
        duration={8000}
        autoDismiss={true}
      />

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && (
          <>
            {/* Asset Information */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('workOrder.assetInfo')}</Text>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('workOrder.assetId')}:</Text>
                  <Text style={styles.detailValue}>{workOrder.assetId || 'N/A'}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('workOrder.assetType')}:</Text>
                  <Text style={styles.detailValue}>{workOrder.assetType || 'N/A'}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('workOrder.maintenanceDate')}:</Text>
                  <Text style={styles.detailValue}>{workOrder.maintenanceDate ? formatDateOnly(workOrder.maintenanceDate) : 'Invalid Date'}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('workOrder.serialNumber')}:</Text>
                  <Text style={styles.detailValue}>{workOrder.serialNumber || workOrder.assetName || 'N/A'}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('workOrder.location')}:</Text>
                  <Text style={styles.detailValue}>{workOrder.location || 'N/A'}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('workOrder.currentCondition')}:</Text>
                  <Text style={styles.detailValue}>{workOrder.currentCondition || 'N/A'}</Text>
                </View>
              </View>
            </View>

            {/* Additional Issues */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('workOrder.additionalIssues')}</Text>

              <View style={styles.additionalIssuesContainer}>
                <Text style={styles.additionalIssuesLabel}>{t('workOrder.additionalIssuesIdentified')}</Text>
                <Text style={styles.additionalIssuesText}>{workOrder.description || workOrder.additionalIssues || 'N/A'}</Text>
              </View>
            </View>

          </>
        )}

        {activeTab === 'vendor' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('workOrder.vendorInfo')}</Text>

            <View style={styles.vendorGrid}>
              <View style={styles.vendorColumn}>
                <View style={styles.vendorField}>
                  <Text style={styles.vendorLabel}>{t('workOrder.vendorName')}:</Text>
                  <Text style={styles.vendorValue}>
                    {workOrder.vendorName || workOrder.vendor?.name || workOrder.vendor?.vendor_name || 'N/A'}
                  </Text>
                </View>

                <View style={styles.vendorField}>
                  <Text style={styles.vendorLabel}>{t('workOrder.email')}:</Text>
                  <Text style={styles.vendorValue}>
                    {workOrder.vendorEmail || workOrder.vendor?.email || workOrder.vendor?.vendor_email || 'N/A'}
                  </Text>
                </View>

                <View style={styles.vendorField}>
                  <Text style={styles.vendorLabel}>{t('workOrder.maintenanceType')}:</Text>
                  <Text style={styles.vendorValue}>
                    {workOrder.maintenanceType || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.vendorColumn}>
                <View style={styles.vendorField}>
                  <Text style={styles.vendorLabel}>{t('workOrder.contactPerson')}:</Text>
                  <Text style={styles.vendorValue}>
                    {workOrder.contactPerson || workOrder.vendor?.contact_person || workOrder.vendor?.contact_name || 'N/A'}
                  </Text>
                </View>

                <View style={styles.vendorField}>
                  <Text style={styles.vendorLabel}>{t('workOrder.phone')}:</Text>
                  <Text style={styles.vendorValue}>
                    {workOrder.vendorPhone || workOrder.vendor?.phone || workOrder.vendor?.vendor_phone || 'N/A'}
                  </Text>
                </View>

                <View style={styles.vendorField}>
                  <Text style={styles.vendorLabel}>{t('workOrder.status')}:</Text>
                  <View style={[styles.vendorStatusBadge, { backgroundColor: getStatusColor(workOrder.status) + '20' }]}>
                    <Text style={[styles.vendorStatusText, { color: getStatusColor(workOrder.status) }]}>
                      {getStatusText(workOrder.status)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'checklist' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('workOrder.maintenanceChecklist')}</Text>

            {loadingChecklist ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003667" />
                <Text style={styles.loadingText}>{t('common.loading') || 'Loading checklist...'}</Text>
              </View>
            ) : checklistData.length > 0 ? (
              <View style={styles.checklistContainer}>
                {checklistData.map((item, index) => (
                  <View key={index} style={styles.checklistItem}>
                    <View style={styles.checklistItemHeader}>
                      <Text style={styles.checklistItemText}>
                        {item.item || item.title || item.name || item.checklist_item || `Item ${index + 1}`}
                      </Text>
                    </View>
                    {item.description && (
                      <Text style={styles.checklistItemDescription}>
                        {item.description}
                      </Text>
                    )}
                    {item.instructions && (
                      <Text style={styles.checklistItemInstructions}>
                        Instructions: {item.instructions}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyChecklistContainer}>
                <MaterialCommunityIcons name="clipboard-outline" size={48} color="#ccc" />
                <Text style={styles.emptyChecklistText}>
                  {workOrder?.assetTypeId 
                    ? t('maintenance.noChecklistItems') || 'No checklist items found'
                    : 'Asset type ID not available'}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'history' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('workOrder.previousMaintenanceRecords')}</Text>

            <View style={styles.historyContainer}>
              <View style={styles.historyRecord}>
                <View style={styles.historyRecordLeft}>
                  <View style={styles.historyIconContainer}>
                    <MaterialCommunityIcons name="wrench" size={24} color="#2196F3" />
                  </View>
                  <View style={styles.historyRecordDetails}>
                    <Text style={styles.historyActivityText}>{t('workOrder.maintenanceActivity')}</Text>
                    <Text style={styles.historyDateText}>13/10/2025</Text>
                    <Text style={styles.historyVendorText}>{t('workOrder.vendor')}: Ramesh Kishna</Text>
                  </View>
                </View>

                <View style={styles.historyRecordRight}>
                  <View style={[styles.historyStatusBadge, { backgroundColor: getStatusColor('in_progress') + '20' }]}>
                    <Text style={[styles.historyStatusText, { color: getStatusColor('in_progress') }]}>
                      {t('workOrder.statusInProgress')}
                    </Text>
                  </View>
                  <Text style={styles.historyIdText}>{t('workOrder.maintenanceId')}: ams001</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
  },
  appBar: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    zIndex: 2,
  },
  centerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  rightPlaceholder: {
    padding: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginRight: RESPONSIVE_CONSTANTS.SPACING.SM,
    zIndex: 2,
  },
  appbarTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
  },
  exportButtonContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  exportButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  exportButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    padding: RESPONSIVE_CONSTANTS.CARD_PADDING,
    marginVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  cardTitle: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XL,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  statusBadge: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XS,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.LG,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    fontWeight: '600',
  },
  workOrderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  workOrderId: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#666',
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  sectionTitle: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '600',
    color: '#333',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  detailsGrid: {
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  descriptionText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  errorText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: '#666',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#666',
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  additionalIssuesContainer: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  additionalIssuesLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#666',
    fontWeight: '500',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  additionalIssuesText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    lineHeight: 20,
  },
  vendorGrid: {
    flexDirection: 'row',
    gap: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  vendorColumn: {
    flex: 1,
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  vendorField: {
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  vendorLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#666',
    fontWeight: '500',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  vendorValue: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    fontWeight: '500',
  },
  vendorStatusBadge: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XS,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    alignSelf: 'flex-start',
  },
  vendorStatusText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    fontWeight: '600',
  },
  checklistContainer: {
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  checklistItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  checklistItemText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    fontWeight: '600',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  checklistItemHeader: {
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  checklistItemDescription: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#666',
    marginTop: RESPONSIVE_CONSTANTS.SPACING.SM,
    lineHeight: 20,
  },
  checklistItemInstructions: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#888',
    fontStyle: 'italic',
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XS,
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  loadingText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.MD,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#666',
  },
  emptyChecklistContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  emptyChecklistText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.MD,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#666',
    textAlign: 'center',
  },
  historyContainer: {
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  historyRecord: {
    backgroundColor: '#F8F9FA',
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyRecordLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  historyIconContainer: {
    marginRight: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  historyRecordDetails: {
    flex: 1,
  },
  historyActivityText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    fontWeight: '600',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  historyDateText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#666',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  historyVendorText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#666',
  },
  historyRecordRight: {
    alignItems: 'flex-end',
  },
  historyStatusBadge: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XS,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  historyStatusText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    fontWeight: '600',
  },
  historyIdText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#666',
    fontWeight: '500',
  },
});

export default WorkOrderDetailsScreen;
