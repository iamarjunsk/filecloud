import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Keyboard } from '@capacitor/keyboard'

export const mobileService = {
  isMobile(): boolean {
    return Capacitor.isNativePlatform()
  },

  async initialize() {
    if (!this.isMobile()) return

    try {
      await SplashScreen.hide()
      
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: '#ffffff' })
      
      await Keyboard.setResizeMode({ mode: 'body' })
      
      document.body.classList.add('is-mobile')
    } catch (error) {
      console.error('Failed to initialize mobile service:', error)
    }
  },

  async showSplash() {
    if (!this.isMobile()) return
    try {
      await SplashScreen.show()
    } catch (error) {
      console.error('Failed to show splash:', error)
    }
  },

  async hideSplash() {
    if (!this.isMobile()) return
    try {
      await SplashScreen.hide()
    } catch (error) {
      console.error('Failed to hide splash:', error)
    }
  },
}
