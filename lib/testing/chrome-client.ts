/**
 * Chrome Client - Handles browser automation via Puppeteer
 */

import puppeteer, { Browser, Page } from 'puppeteer-core'
import { launch } from 'chrome-launcher'
import type { ConsoleLog, NetworkError } from './types'

export class ChromeClient {
  private browser: Browser | null = null
  private page: Page | null = null
  private consoleLogs: ConsoleLog[] = []
  private networkErrors: NetworkError[] = []
  private chromeInstance: any = null
  private slowMo: number = 0

  async connect(headless = false, devtools = true, slowMo = 0): Promise<void> {
    this.slowMo = slowMo

    try {
      // Launch Chrome with fixed debugging port and visible window
      this.chromeInstance = await launch({
        port: 9222,
        chromeFlags: [
          '--no-first-run',
          '--no-default-browser-check',
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          headless ? '--headless=new' : '',
          devtools && !headless ? '--auto-open-devtools-for-tabs' : '',
        ].filter(Boolean),
      })

      console.log(`Chrome launched on port ${this.chromeInstance.port}`)

      // Wait a moment for Chrome to be ready
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Connect to Chrome via puppeteer
      this.browser = await puppeteer.connect({
        browserURL: `http://localhost:${this.chromeInstance.port}`,
        defaultViewport: null, // Use full window
      })

      // Create a new page
      this.page = await this.browser.newPage()

      // Setup console monitoring
      this.page.on('console', (msg) => {
        const level = msg.type() as 'error' | 'warning' | 'info' | 'log'
        if (level === 'error' || level === 'warning') {
          this.consoleLogs.push({
            level,
            message: msg.text(),
            timestamp: new Date().toISOString(),
          })
        }
      })

      // Setup network monitoring
      this.page.on('response', (response) => {
        const status = response.status()
        if (status >= 400) {
          this.networkErrors.push({
            url: response.url(),
            method: response.request().method(),
            status,
            statusText: response.statusText(),
            timestamp: new Date().toISOString(),
          })
        }
      })

      console.log('✓ Chrome client connected')
    } catch (error) {
      console.error('Failed to connect to Chrome:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.page) {
      await this.page.close()
      this.page = null
    }
    if (this.browser) {
      await this.browser.disconnect()
      this.browser = null
    }
    if (this.chromeInstance) {
      await this.chromeInstance.kill()
      this.chromeInstance = null
    }
    console.log('✓ Chrome client disconnected')
  }

  isConnected(): boolean {
    return this.browser !== null && this.page !== null
  }

  async navigate(url: string, timeout = 30000): Promise<void> {
    if (!this.page) throw new Error('Page not initialized')

    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout,
    })

    // Wait for page to be fully loaded
    await this.page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve(true)
        } else {
          window.addEventListener('load', () => resolve(true))
        }
      })
    })
  }

  async click(selector: string, timeout = 5000): Promise<void> {
    if (!this.page) throw new Error('Page not initialized')

    await this.page.waitForSelector(selector, { timeout })

    // Highlight element before clicking
    await this.highlightElement(selector)

    // Apply slowMo delay
    if (this.slowMo > 0) {
      await new Promise(resolve => setTimeout(resolve, this.slowMo))
    }

    await this.page.click(selector)
    await new Promise(resolve => setTimeout(resolve, 500)) // Wait for any side effects
  }

  async type(selector: string, text: string, timeout = 5000): Promise<void> {
    if (!this.page) throw new Error('Page not initialized')

    await this.page.waitForSelector(selector, { timeout })
    await this.page.type(selector, text)
  }

  async assertElementExists(selector: string, timeout = 5000): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized')

    try {
      await this.page.waitForSelector(selector, { timeout })
      return true
    } catch {
      return false
    }
  }

  async screenshot(path: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized')

    await this.page.screenshot({
      path: path as `${string}.png`,
      fullPage: true,
    })
  }

  async wait(ms: number): Promise<void> {
    if (!this.page) throw new Error('Page not initialized')
    await new Promise(resolve => setTimeout(resolve, ms))
  }

  getConsoleLogs(): ConsoleLog[] {
    return [...this.consoleLogs]
  }

  getNetworkErrors(): NetworkError[] {
    return [...this.networkErrors]
  }

  clearLogs(): void {
    this.consoleLogs = []
    this.networkErrors = []
  }

  private async highlightElement(selector: string): Promise<void> {
    if (!this.page) return

    await this.page.evaluate((sel) => {
      const element = document.querySelector(sel)
      if (element) {
        const original = (element as HTMLElement).style.border
        ;(element as HTMLElement).style.border = '3px solid yellow'
        setTimeout(() => {
          ;(element as HTMLElement).style.border = original
        }, 500)
      }
    }, selector)
  }

  async injectOverlay(content: string): Promise<void> {
    if (!this.page) return

    await this.page.evaluate((html) => {
      // Remove existing overlay
      const existing = document.getElementById('test-overlay')
      if (existing) existing.remove()

      // Create new overlay
      const overlay = document.createElement('div')
      overlay.id = 'test-overlay'
      overlay.innerHTML = html
      overlay.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        z-index: 999999;
        min-width: 300px;
      `
      document.body.appendChild(overlay)
    }, content)
  }

  async updateOverlay(testName: string, stepDesc: string, status: string, retries: number): Promise<void> {
    const content = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #4CAF50;">
        🤖 Autonomous Test Runner
      </div>
      <div style="margin-bottom: 5px;">Test: ${testName}</div>
      <div style="margin-bottom: 5px;">Step: ${stepDesc}</div>
      <div style="margin-bottom: 5px;">Status: ${status}</div>
      <div>Retries: ${retries}/3</div>
    `
    await this.injectOverlay(content)
  }
}
