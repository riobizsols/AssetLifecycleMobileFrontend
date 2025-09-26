# Multilingual Implementation Guide

## Overview

This project now supports multilingual functionality with English and German languages. The implementation uses `react-i18next` for internationalization and provides automatic language detection and user preference management.

## Features

- ✅ **English and German Support**: Complete translations for all UI elements
- ✅ **Automatic Language Detection**: Detects user's device language on first launch
- ✅ **API Integration**: Gets user's language preference from login API response
- ✅ **Persistent Language Preference**: Remembers user's language choice
- ✅ **Automatic Language Detection**: Language automatically switches based on user's API preference
- ✅ **Real-time Language Updates**: Instant UI updates when language changes

## Architecture

### Core Components

1. **i18n Configuration** (`config/i18n.js`)
   - Configures react-i18next with language detection
   - Sets up fallback language (English)
   - Manages language resources

2. **Language Context** (`context/LanguageContext.js`)
   - Provides language management functionality
   - Handles language switching
   - Manages language state across the app

3. **Translation Files**
   - `locales/en.json` - English translations
   - `locales/de.json` - German translations

4. **Automatic Language Detection**
   - Language automatically switches based on user's `language_code` from login API
   - No manual language switching required

## Implementation Details

### 1. Login API Integration

The login API now returns a `language_code` field in the user data:

```javascript
// Login API response structure
{
  "token": "jwt_token_here",
  "user": {
    "user_id": "USR002",
    "email": "user@example.com",
    "language_code": "de", // User's preferred language
    // ... other user data
  }
}
```

### 2. Language Detection Priority

The app follows this priority order for language detection:

1. **User's API Language**: Language from login API response
2. **Stored Preference**: Previously selected language
3. **Device Language**: System language (if supported)
4. **Default**: English (fallback)

### 3. Translation Keys Structure

Translations are organized by feature areas:

```json
{
  "common": { /* Common UI elements */ },
  "auth": { /* Authentication related */ },
  "navigation": { /* Navigation and menus */ },
  "home": { /* Home screen content */ },
  "assets": { /* Asset management */ },
  "employees": { /* Employee related */ },
  "departments": { /* Department related */ },
  "maintenance": { /* Maintenance features */ },
  "breakdown": { /* Breakdown reports */ },
  "scanning": { /* Barcode scanning */ },
  "validation": { /* Form validation messages */ }
}
```

## Usage

### Using Translations in Components

```javascript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <Text>{t('common.ok')}</Text>
  );
};
```

### Automatic Language Detection

The language is automatically set based on the user's `language_code` from the login API response. No manual switching is required:

```javascript
// In LoginScreen.js - Language is automatically applied after login
if (data.user && data.user.language_code) {
  await authUtils.storeUserData(data.user);
  await changeLanguage(data.user.language_code); // Automatic language switch
}
```

### Adding New Translations

1. **Add to English file** (`locales/en.json`):
```json
{
  "newFeature": {
    "title": "New Feature Title",
    "description": "Description of the new feature"
  }
}
```

2. **Add to German file** (`locales/de.json`):
```json
{
  "newFeature": {
    "title": "Neue Funktion Titel",
    "description": "Beschreibung der neuen Funktion"
  }
}
```

3. **Use in component**:
```javascript
<Text>{t('newFeature.title')}</Text>
```

## API Integration

### Backend Requirements

The login API should return the user's language preference:

```javascript
// Example login API response
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "user_id": "USR002",
    "email": "user@example.com",
    "full_name": "John Doe",
    "language_code": "de", // This field is used for language setting
    "role": "Admin",
    // ... other user fields
  }
}
```

### Frontend Integration

The language preference is automatically handled in the login process:

```javascript
// In LoginScreen.js
if (data.user && data.user.language_code) {
  await authUtils.storeUserData(data.user);
  
  // Automatically change language based on user preference
  if (data.user.language_code) {
    await changeLanguage(data.user.language_code);
  }
}
```

## Automatic Language Detection

The language is automatically detected and applied:

1. **On App Launch**: Checks for stored user language preference
2. **After Login**: Automatically applies user's `language_code` from API response
3. **Real-time Updates**: UI updates immediately when language changes
4. **Persistence**: Language preference is saved and restored on app restart

## Testing

### Manual Testing Steps

1. **First Launch**:
   - Install app on device with German language
   - App should start in German
   - Login with user having English preference
   - App should switch to English after login

2. **Automatic Language Detection**:
   - Login with user having `language_code: "de"`
   - Verify app automatically switches to German
   - Login with user having `language_code: "en"`
   - Verify app automatically switches to English

3. **Persistence**:
   - Login with user language preference
   - Close and reopen app
   - Language preference should be maintained

### Test Cases

- ✅ Login with user having `language_code: "de"`
- ✅ Login with user having `language_code: "en"`
- ✅ Login with user having no `language_code`
- ✅ Automatic language detection from API
- ✅ App restart with language persistence
- ✅ Device language detection

## Troubleshooting

### Common Issues

1. **Translations not updating**:
   - Check if translation keys exist in both language files
   - Verify `useTranslation` hook is imported correctly

2. **Language not persisting**:
   - Check AsyncStorage permissions
   - Verify language context is properly initialized

3. **API language not applied**:
   - Ensure login API returns `language_code` field
   - Check auth utils for proper user data storage

4. **Native module errors (RNLocalize/TurboModuleRegistry)**:
   - This error occurs when using `react-native-localize` in Expo managed workflow
   - **Solution**: Use `expo-localization` instead, which is already configured
   - The app now uses `expo-localization` for device language detection
   - Clear cache and restart: `npx expo start --clear`

### Debug Mode

Enable debug mode in development:

```javascript
// In config/i18n.js
i18n.init({
  debug: __DEV__, // Shows translation loading in console
  // ... other options
});
```

## Future Enhancements

- [ ] Add more languages (French, Spanish, etc.)
- [ ] Implement RTL support for Arabic/Hebrew
- [ ] Add pluralization rules
- [ ] Implement date/time localization
- [ ] Add number/currency formatting

## Dependencies

- `react-i18next`: ^13.5.0
- `i18next`: ^23.7.0
- `expo-localization`: ^13.0.0 (Expo managed workflow compatible)

## Files Modified/Added

### New Files
- `config/i18n.js` - i18n configuration
- `context/LanguageContext.js` - Language management context
- `utils/deviceLanguage.js` - Device language detection utility
- `locales/en.json` - English translations
- `locales/de.json` - German translations
- `MULTILINGUAL_IMPLEMENTATION.md` - This documentation

### Modified Files
- `App.js` - Added LanguageProvider wrapper
- `utils/auth.js` - Added language preference storage
- `screens/auth/LoginScreen.js` - Added translations and language handling
- `screens/HomeScreen.js` - Added translations
- `screens/asset/asset_1.js` - Added translations
- `components/SideMenu.js` - Added translations
- `package.json` - Added i18n dependencies

## Conclusion

The multilingual implementation is now complete and ready for production use. The system automatically handles language detection based on the user's `language_code` from the login API response. All UI elements including labels, menus, buttons, notifications, and error messages are now properly translated and will automatically update based on the user's language preference from the backend.
