import * as SecureStore from 'expo-secure-store';

const EMAIL_KEY = 'english_app_remembered_email';

export async function saveRememberedEmail(email: string) {
  await SecureStore.setItemAsync(EMAIL_KEY, email);
}

export async function loadRememberedEmail(): Promise<string | null> {
  return SecureStore.getItemAsync(EMAIL_KEY);
}
