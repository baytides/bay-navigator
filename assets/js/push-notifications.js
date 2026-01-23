/**
 * Push Notification Manager for Bay Navigator
 *
 * Handles Web Push API subscription and preference management
 */

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    // VAPID public key for Web Push
    vapidPublicKey:
      'BLeNKtUjnTV8lk4cyLSS__synWrEVm86GRiS4frzFfdYAUF12IRqqXBj4i4DMlkFVGvdrUB-_Onid0rj5h8eMsE',
    registerEndpoint: 'https://baynavigator-push.azurewebsites.net/api/push-register',
    storageKey: 'baynavigator_push_preferences',
  };

  // Push notification manager
  const PushManager = {
    /**
     * Check if push notifications are supported
     */
    isSupported() {
      return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    },

    /**
     * Get current permission state
     */
    getPermission() {
      if (!this.isSupported()) return 'unsupported';
      return Notification.permission; // 'granted', 'denied', or 'default'
    },

    /**
     * Request notification permission
     */
    async requestPermission() {
      if (!this.isSupported()) {
        return { success: false, error: 'Push notifications not supported' };
      }

      try {
        const permission = await Notification.requestPermission();
        return { success: permission === 'granted', permission };
      } catch (error) {
        console.error('Permission request failed:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get the current push subscription
     */
    async getSubscription() {
      if (!this.isSupported()) return null;

      try {
        const registration = await navigator.serviceWorker.ready;
        return await registration.pushManager.getSubscription();
      } catch (error) {
        console.error('Failed to get subscription:', error);
        return null;
      }
    },

    /**
     * Subscribe to push notifications
     */
    async subscribe(preferences = {}) {
      if (!this.isSupported()) {
        return { success: false, error: 'Push notifications not supported' };
      }

      if (Notification.permission !== 'granted') {
        const permResult = await this.requestPermission();
        if (!permResult.success) {
          return { success: false, error: 'Permission denied' };
        }
      }

      try {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // Create new subscription
          if (!CONFIG.vapidPublicKey) {
            console.warn('VAPID public key not configured');
            return { success: false, error: 'Push notifications not configured' };
          }

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this._urlBase64ToUint8Array(CONFIG.vapidPublicKey),
          });
        }

        // Register with backend
        const registerResult = await this._registerWithBackend(subscription, preferences);

        if (registerResult.success) {
          // Save preferences locally
          this._savePreferences({
            ...preferences,
            subscribed: true,
            installationId: registerResult.installationId,
          });
        }

        return registerResult;
      } catch (error) {
        console.error('Subscription failed:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribe() {
      try {
        const subscription = await this.getSubscription();

        if (subscription) {
          // Unregister from backend
          await this._unregisterFromBackend(subscription);

          // Unsubscribe locally
          await subscription.unsubscribe();
        }

        // Clear local preferences
        this._savePreferences({ subscribed: false });

        return { success: true };
      } catch (error) {
        console.error('Unsubscribe failed:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Update notification preferences
     */
    async updatePreferences(preferences) {
      const subscription = await this.getSubscription();

      if (!subscription) {
        // Not subscribed, just save locally
        this._savePreferences({ ...preferences, subscribed: false });
        return { success: true };
      }

      // Re-register with updated preferences
      return await this._registerWithBackend(subscription, preferences);
    },

    /**
     * Get saved preferences
     */
    getPreferences() {
      try {
        const stored = localStorage.getItem(CONFIG.storageKey);
        return stored
          ? JSON.parse(stored)
          : {
              subscribed: false,
              weatherAlerts: true,
              weatherCounties: [],
              programUpdates: true,
              announcements: true,
            };
      } catch {
        return { subscribed: false };
      }
    },

    /**
     * Check if currently subscribed
     */
    async isSubscribed() {
      const subscription = await this.getSubscription();
      return !!subscription;
    },

    // Private methods

    _savePreferences(preferences) {
      try {
        const current = this.getPreferences();
        localStorage.setItem(CONFIG.storageKey, JSON.stringify({ ...current, ...preferences }));
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    },

    async _registerWithBackend(subscription, preferences) {
      try {
        const response = await fetch(CONFIG.registerEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: 'web',
            token: JSON.stringify(subscription),
            preferences,
          }),
        });

        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Backend registration failed:', error);
        return { success: false, error: 'Failed to register with server' };
      }
    },

    async _unregisterFromBackend(subscription) {
      try {
        await fetch(CONFIG.registerEndpoint, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: 'web',
            token: JSON.stringify(subscription),
          }),
        });
      } catch (error) {
        console.error('Backend unregistration failed:', error);
      }
    },

    _urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    },
  };

  // UI Helper for notification settings - builds DOM safely without innerHTML
  const NotificationSettingsUI = {
    /**
     * Initialize settings UI
     */
    init(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      this.container = container;
      this.render();
      this.bindEvents();
    },

    /**
     * Create element helper
     */
    createElement(tag, attrs = {}, children = []) {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
          el.className = value;
        } else if (key === 'textContent') {
          el.textContent = value;
        } else if (key.startsWith('data')) {
          el.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
        } else {
          el.setAttribute(key, value);
        }
      });
      children.forEach((child) => {
        if (typeof child === 'string') {
          el.appendChild(document.createTextNode(child));
        } else if (child) {
          el.appendChild(child);
        }
      });
      return el;
    },

    render() {
      const isSupported = PushManager.isSupported();
      const permission = PushManager.getPermission();
      const preferences = PushManager.getPreferences();

      // Clear container
      this.container.replaceChildren();

      if (!isSupported) {
        const msg = this.createElement('div', { className: 'notification-settings-unsupported' }, [
          this.createElement('p', {
            className: 'text-neutral-600 dark:text-neutral-400',
            textContent: 'Push notifications are not supported in this browser.',
          }),
        ]);
        this.container.appendChild(msg);
        return;
      }

      if (permission === 'denied') {
        const msg = this.createElement('div', { className: 'notification-settings-denied' }, [
          this.createElement('p', {
            className: 'text-neutral-600 dark:text-neutral-400',
            textContent: 'Notifications are blocked. Please enable them in your browser settings.',
          }),
        ]);
        this.container.appendChild(msg);
        return;
      }

      // Build settings UI
      const wrapper = this.createElement('div', { className: 'notification-settings space-y-4' });

      // Main toggle row
      const toggleRow = this.createElement('div', {
        className: 'flex items-center justify-between',
      });

      const labelDiv = this.createElement('div', {}, [
        this.createElement('h4', {
          className: 'font-medium text-neutral-900 dark:text-white',
          textContent: 'Push Notifications',
        }),
        this.createElement('p', {
          className: 'text-sm text-neutral-600 dark:text-neutral-400',
          textContent: 'Get alerts about programs and updates',
        }),
      ]);

      const toggleLabel = this.createElement('label', {
        className: 'relative inline-flex items-center cursor-pointer',
      });
      const toggleInput = this.createElement('input', {
        type: 'checkbox',
        id: 'push-enabled',
        className: 'sr-only peer',
      });
      if (preferences.subscribed) toggleInput.checked = true;

      const toggleDiv = this.createElement('div', {
        className:
          "w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600",
      });

      toggleLabel.appendChild(toggleInput);
      toggleLabel.appendChild(toggleDiv);
      toggleRow.appendChild(labelDiv);
      toggleRow.appendChild(toggleLabel);
      wrapper.appendChild(toggleRow);

      // Preferences section
      const prefsSection = this.createElement('div', {
        id: 'notification-preferences',
        className:
          (preferences.subscribed ? '' : 'hidden ') +
          'space-y-3 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700',
      });

      // Announcements checkbox
      const announcementsLabel = this.createElement('label', {
        className: 'flex items-center gap-3',
      });
      const announcementsInput = this.createElement('input', {
        type: 'checkbox',
        id: 'pref-announcements',
        className: 'rounded',
      });
      if (preferences.announcements !== false) announcementsInput.checked = true;
      announcementsLabel.appendChild(announcementsInput);
      announcementsLabel.appendChild(
        this.createElement('span', {
          className: 'text-sm text-neutral-700 dark:text-neutral-300',
          textContent: 'Announcements and updates',
        })
      );

      // Programs checkbox
      const programsLabel = this.createElement('label', { className: 'flex items-center gap-3' });
      const programsInput = this.createElement('input', {
        type: 'checkbox',
        id: 'pref-programs',
        className: 'rounded',
      });
      if (preferences.programUpdates !== false) programsInput.checked = true;
      programsLabel.appendChild(programsInput);
      programsLabel.appendChild(
        this.createElement('span', {
          className: 'text-sm text-neutral-700 dark:text-neutral-300',
          textContent: 'New programs matching my filters',
        })
      );

      prefsSection.appendChild(announcementsLabel);
      prefsSection.appendChild(programsLabel);
      wrapper.appendChild(prefsSection);

      this.container.appendChild(wrapper);
    },

    bindEvents() {
      const enableToggle = this.container.querySelector('#push-enabled');
      const preferencesSection = this.container.querySelector('#notification-preferences');

      if (enableToggle) {
        enableToggle.addEventListener('change', async (e) => {
          const enabled = e.target.checked;

          if (enabled) {
            const result = await PushManager.subscribe(this.getPreferencesFromUI());
            if (!result.success) {
              e.target.checked = false;
              if (window.toast) {
                window.toast.error(result.error || 'Failed to enable notifications');
              }
              return;
            }
            if (window.toast) {
              window.toast.success('Notifications enabled');
            }
          } else {
            await PushManager.unsubscribe();
            if (window.toast) {
              window.toast.info('Notifications disabled');
            }
          }

          if (preferencesSection) {
            preferencesSection.classList.toggle('hidden', !enabled);
          }
        });
      }

      // Preference checkboxes
      this.container.querySelectorAll('#notification-preferences input').forEach((input) => {
        input.addEventListener('change', async () => {
          await PushManager.updatePreferences(this.getPreferencesFromUI());
        });
      });
    },

    getPreferencesFromUI() {
      return {
        announcements: this.container.querySelector('#pref-announcements')?.checked ?? true,
        programUpdates: this.container.querySelector('#pref-programs')?.checked ?? true,
      };
    },
  };

  // Expose to global scope
  window.PushNotifications = PushManager;
  window.NotificationSettingsUI = NotificationSettingsUI;

  // Auto-init if settings container exists
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('notification-settings');
    if (container) {
      NotificationSettingsUI.init('notification-settings');
    }
  });
})();
