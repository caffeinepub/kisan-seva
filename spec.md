# Kisan Seva — Voice Input Feature

## Current State
BookingsPage and TransactionsPage have form fields for party, service, time, amount, etc. No voice input exists. The app has i18n support (Gujarati, Hindi, English).

## Requested Changes (Diff)

### Add
- `useVoiceInput` hook: wraps Web Speech API, returns `startListening`, `stopListening`, `isListening`, `transcript` state
- `VoiceInputButton` component: mic icon button that activates voice recognition; shows animated indicator when active
- Smart field parser: parses transcript to extract party name, service type, hours/minutes, amount, payment type, date, notes — works with Hindi/Gujarati/English natural language and field-specific triggers
- Voice confirmation popup (modal) in TransactionsPage: after voice fill, shows all detected fields with values; user must confirm before save
- Voice confirmation popup in BookingsPage: same behavior

### Modify
- `TransactionsPage.tsx`: Add global voice mic button (floating or in header); on voice recognition, parse transcript and fill matching fields; show confirmation popup before save when voice was used
- `BookingsPage.tsx`: Add global voice mic button; on voice recognition, parse transcript and fill all matching booking fields

### Remove
- Nothing

## Implementation Plan
1. Create `src/frontend/src/hooks/useVoiceInput.ts` — Web Speech API wrapper
2. Create `src/frontend/src/components/VoiceInputButton.tsx` — mic button UI component
3. Create `src/frontend/src/lib/voiceParser.ts` — smart NLP parser for Hindi/Gujarati/English voice input
4. Add voice button + confirmation modal to TransactionsPage
5. Add voice button + confirmation modal to BookingsPage
