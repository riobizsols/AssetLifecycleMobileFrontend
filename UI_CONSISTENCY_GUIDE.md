# UI Consistency Guide for Multi-Language Support

## Overview
This guide explains how to maintain consistent UI alignment across all languages in the React Native app. The solution includes standardized UI constants, flexible layouts, and proper text handling.

## Key Components

### 1. UI Constants (`utils/uiConstants.js`)
- **Spacing**: Consistent spacing values (XS: 4px, SM: 8px, MD: 12px, LG: 16px, XL: 20px, XXL: 24px, XXXL: 32px)
- **Font Sizes**: Standardized font sizes that work across all languages
- **Colors**: Consistent color palette
- **Dimensions**: Standard button heights, input heights, icon sizes
- **Minimum Widths**: Ensures consistent layout regardless of text length

### 2. Common Styles (`COMMON_STYLES`)
- Pre-defined styles for common UI elements
- Consistent text styles, button styles, input styles
- Card and container styles with proper shadows and spacing

### 3. Text Handling Best Practices

#### Always Use Text Constraints
```jsx
<Text 
  style={styles.title}
  numberOfLines={2}
  ellipsizeMode="tail"
>
  {t('some.long.translation.key')}
</Text>
```

#### Flexible Layouts
```jsx
<View style={styles.menuTextContainer}>
  <Text 
    style={styles.menuTitle}
    numberOfLines={2}
    ellipsizeMode="tail"
  >
    {item.title}
  </Text>
  <Text 
    style={styles.menuSubtitle}
    numberOfLines={2}
    ellipsizeMode="tail"
  >
    {item.subtitle}
  </Text>
</View>
```

## Implementation Examples

### Updated Components

#### 1. HomeScreen
- ✅ Uses UI_CONSTANTS for spacing and dimensions
- ✅ Text elements have numberOfLines and ellipsizeMode
- ✅ Consistent icon sizes and colors
- ✅ Flexible menu item layouts

#### 2. LoginScreen
- ✅ Standardized input heights and padding
- ✅ Consistent button sizes
- ✅ Text wrapping for long translations
- ✅ Proper placeholder text handling

#### 3. SideMenu
- ✅ Consistent menu item spacing
- ✅ Text truncation for long menu titles
- ✅ Standardized icon sizes
- ✅ Flexible user information display

#### 4. CustomAlert
- ✅ Consistent button sizes
- ✅ Text wrapping for alert messages
- ✅ Standardized spacing and colors
- ✅ Responsive layout

## Language-Specific Considerations

### Text Length Variations
- **German**: Often 20-30% longer than English
- **Spanish**: Similar length to English
- **Portuguese**: Similar length to English
- **English**: Baseline reference

### Solutions Applied
1. **Flexible Containers**: Use `flex: 1` for text containers
2. **Text Truncation**: `numberOfLines` and `ellipsizeMode="tail"`
3. **Minimum Widths**: Ensure buttons and cards maintain minimum sizes
4. **Responsive Spacing**: Use UI_CONSTANTS for consistent spacing

## Best Practices

### 1. Always Import UI Constants
```javascript
import { UI_CONSTANTS, COMMON_STYLES, UI_UTILS } from '../utils/uiConstants';
```

### 2. Use Common Styles
```javascript
const styles = StyleSheet.create({
  container: {
    ...COMMON_STYLES.container,
  },
  button: {
    ...COMMON_STYLES.button,
    ...COMMON_STYLES.buttonPrimary,
  },
  text: {
    ...COMMON_STYLES.text.primary,
  },
});
```

### 3. Apply Text Constraints
```javascript
<Text 
  style={styles.title}
  numberOfLines={2}
  ellipsizeMode="tail"
>
  {t('translation.key')}
</Text>
```

### 4. Use Consistent Spacing
```javascript
padding: UI_CONSTANTS.SPACING.LG,
marginBottom: UI_CONSTANTS.SPACING.XXL,
```

### 5. Standardize Icon Sizes
```javascript
<MaterialCommunityIcons
  name="icon-name"
  size={UI_CONSTANTS.ICON_SIZES.LG}
  color={UI_CONSTANTS.COLORS.PRIMARY}
/>
```

## Testing Across Languages

### Test Scenarios
1. **Switch between all 4 languages** (English, German, Spanish, Portuguese)
2. **Check text overflow** - ensure no text is cut off
3. **Verify button sizes** - buttons should maintain consistent sizes
4. **Test menu items** - long translations should wrap properly
5. **Check form inputs** - labels and placeholders should display correctly

### Expected Results
- ✅ No layout shifts when changing languages
- ✅ Consistent button and input sizes
- ✅ Proper text wrapping and truncation
- ✅ Maintained visual hierarchy
- ✅ No horizontal scrolling or overflow

## Migration Guide

### For Existing Screens
1. Import UI constants
2. Replace hardcoded values with constants
3. Add text constraints (numberOfLines, ellipsizeMode)
4. Use common styles where applicable
5. Test with all languages

### Example Migration
```javascript
// Before
<Text style={{fontSize: 16, color: '#333'}}>
  {t('title')}
</Text>

// After
<Text 
  style={styles.title}
  numberOfLines={2}
  ellipsizeMode="tail"
>
  {t('title')}
</Text>

// With styles
title: {
  ...COMMON_STYLES.text.primary,
}
```

## Benefits

1. **Consistent UI**: Same look and feel across all languages
2. **Better UX**: No layout shifts or text overflow
3. **Maintainable**: Centralized styling constants
4. **Scalable**: Easy to add new languages
5. **Professional**: Polished appearance in all languages

## Future Enhancements

1. **Dynamic Font Scaling**: Adjust font sizes based on language
2. **RTL Support**: Right-to-left language support
3. **Accessibility**: Better screen reader support
4. **Theme Support**: Dark/light mode consistency
5. **Responsive Design**: Better tablet and landscape support
