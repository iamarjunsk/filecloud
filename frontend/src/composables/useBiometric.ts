import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { NativeBiometric } from '@capacitor-community/native-biometric'
import { Preferences } from '@capacitor/preferences'

export interface BiometricResult {
  success: boolean
  error?: string
}

export function useBiometric() {
  const isAvailable = ref(false)
  const isEnabled = ref(false)
  const isUnlocked = ref(false)
  const biometricType = ref<'fingerprint' | 'face' | 'none'>('none')

  const isSupported = computed(() => Capacitor.isNativePlatform())

  const STORAGE_KEY = 'biometric_enabled'

  async function checkAvailability() {
    if (!isSupported.value) {
      isAvailable.value = false
      return
    }

    try {
      const result = await NativeBiometric.isAvailable()
      isAvailable.value = result.available
      
      if (result.biometryType === 'fingerprint') {
        biometricType.value = 'fingerprint'
      } else if (result.biometryType === 'face') {
        biometricType.value = 'face'
      } else {
        biometricType.value = 'none'
      }
    } catch (error) {
      console.error('Failed to check biometric availability:', error)
      isAvailable.value = false
    }
  }

  async function initialize() {
    await checkAvailability()
    
    if (!isAvailable.value) return

    try {
      const enabled = await Preferences.get({ key: STORAGE_KEY })
      isEnabled.value = enabled.value === 'true'
    } catch (error) {
      console.error('Failed to load biometric settings:', error)
    }
  }

  async function setEnabled(enabled: boolean) {
    if (!isAvailable.value) return

    isEnabled.value = enabled
    await Preferences.set({ key: STORAGE_KEY, value: enabled.toString() })
  }

  async function authenticate(): Promise<BiometricResult> {
    if (!isAvailable.value || !isEnabled.value) {
      return { success: true }
    }

    try {
      const result = await NativeBiometric.verifyIdentity({
        reason: 'Authenticate to access FileCloud',
        title: 'Authentication Required',
        subtitle: 'Use biometrics to unlock',
        cancelButtonTitle: 'Cancel',
      })

      isUnlocked.value = result.success
      return { success: result.success }
    } catch (error: any) {
      console.error('Biometric authentication failed:', error)
      return { 
        success: false, 
        error: error?.message || 'Authentication failed' 
      }
    }
  }

  async function lock() {
    isUnlocked.value = false
  }

  function handleAppStateChange(state: string) {
    if (state === 'background' && isEnabled.value) {
      lock()
    }
  }

  onMounted(async () => {
    await initialize()
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && isEnabled.value) {
        lock()
      }
    })
  })

  return {
    isAvailable,
    isEnabled,
    isUnlocked,
    biometricType,
    isSupported,
    initialize,
    setEnabled,
    authenticate,
    lock,
  }
}
