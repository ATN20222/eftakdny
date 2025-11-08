# Translation Implementation Guide

This document outlines the i18n implementation for the Eftakdny application.

## Setup Complete ✅

1. ✅ Installed i18next, react-i18next, and i18next-browser-languagedetector
2. ✅ Created translation files (ar.json and en.json)
3. ✅ Configured i18n with Arabic as default language
4. ✅ Updated Layout with language switcher and mobile menu button
5. ✅ Translated Login, Home, and Children pages
6. ✅ Partially translated AddEditChild page

## Remaining Work

The following pages still need full translation:
- Visitations.jsx
- FindByArea.jsx
- Classes.jsx
- AcademicYears.jsx
- ChildDetail.jsx
- LeafletMap.jsx (component)

## How to Complete Translations

For each page:
1. Import `useTranslation` from 'react-i18next'
2. Add `const { t } = useTranslation();` at the start of the component
3. Replace all hardcoded strings with `t('key')` using the keys from ar.json/en.json

## Translation Keys Structure

All translations are organized by page/feature:
- `common.*` - Common UI elements (buttons, labels, etc.)
- `login.*` - Login page
- `home.*` - Home/Dashboard page
- `children.*` - Children listing page
- `addEditChild.*` - Add/Edit Child form
- `childDetail.*` - Child detail page
- `visitations.*` - Visitations page
- `findByArea.*` - Find by Area page
- `classes.*` - Classes management page
- `academicYears.*` - Academic Years page
- `navigation.*` - Navigation menu items
- `errors.*` - Error messages
- `map.*` - Map-related text

## Next Steps

1. Complete translation of remaining pages
2. Test RTL support for Arabic
3. Verify all translations work correctly
4. Test language switching functionality

