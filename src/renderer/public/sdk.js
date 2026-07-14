/**
 * Token9-快牛 SDK
 * 嵌入式 SDK — 开发者 3 行代码接入
 *
 * 用法:
 *   const shop = new APIShop({ serverUrl: 'http://localhost:3000', channel: 'app-id-xxx' })
 *   const { apiKey, baseURL, userId } = await shop.init()
 */

;(function () {
  'use strict'

  const STYLES = `
    .apishop-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.35); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
        "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
      animation: apishop-fade-in 0.2s ease;
    }
    @keyframes apishop-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes apishop-slide-up {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .apishop-modal {
      background: #fff; border-radius: 20px; width: 380px; max-width: 92vw;
      box-shadow: 0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04);
      animation: apishop-slide-up 0.25s ease;
      overflow: hidden;
    }
    .apishop-header {
      padding: 28px 28px 0; text-align: center;
    }
    .apishop-logo {
      width: 48px; height: 48px; margin: 0 auto 14px;
      border-radius: 14px; background: #0071E3;
      display: flex; align-items: center; justify-content: center;
    }
    .apishop-logo svg { width: 24px; height: 24px; }
    .apishop-title {
      font-size: 20px; font-weight: 700; color: #1d1d1f; margin: 0;
    }
    .apishop-subtitle {
      font-size: 14px; color: #86868b; margin: 4px 0 0;
    }
    .apishop-body { padding: 24px 28px 28px; }
    .apishop-input-group { margin-bottom: 16px; }
    .apishop-label {
      display: block; font-size: 13px; font-weight: 600; color: #1d1d1f; margin-bottom: 6px;
    }
    .apishop-input-row { display: flex; gap: 10px; }
    .apishop-input {
      flex: 1; height: 44px; padding: 0 14px;
      border: 1.5px solid #d2d2d7; border-radius: 12px;
      background: #f5f5f7; font-size: 15px; color: #1d1d1f;
      outline: none; transition: all 0.2s;
      font-family: inherit;
    }
    .apishop-input:focus {
      border-color: #0071E3; background: #fff;
      box-shadow: 0 0 0 3px rgba(0,113,227,0.12);
    }
    .apishop-input::placeholder { color: #aeaeb2; }
    .apishop-btn {
      display: inline-flex; align-items: center; justify-content: center;
      height: 44px; padding: 0 18px; border: none; border-radius: 12px;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: all 0.2s; font-family: inherit;
    }
    .apishop-btn-blue {
      background: #0071E3; color: #fff;
    }
    .apishop-btn-blue:hover { background: #0077ED; }
    .apishop-btn-blue:active { transform: scale(0.97); }
    .apishop-btn-blue:disabled { opacity: 0.5; cursor: not-allowed; }
    .apishop-btn-send {
      background: #0071E3; color: #fff; white-space: nowrap;
      min-width: 110px;
    }
    .apishop-btn-send:hover { background: #0077ED; }
    .apishop-btn-send:disabled { opacity: 0.5; cursor: not-allowed; }
    .apishop-btn-full {
      width: 100%; border-radius: 22px;
    }
    .apishop-code-inputs {
      display: flex; gap: 8px; justify-content: center; margin: 8px 0;
    }
    .apishop-code-digit {
      width: 44px; height: 52px; text-align: center;
      border: 1.5px solid #d2d2d7; border-radius: 12px;
      background: #f5f5f7; font-size: 22px; font-weight: 700;
      color: #1d1d1f; outline: none; transition: all 0.2s;
      font-family: inherit;
    }
    .apishop-code-digit:focus {
      border-color: #0071E3; background: #fff;
      box-shadow: 0 0 0 3px rgba(0,113,227,0.12);
    }
    .apishop-error {
      font-size: 13px; color: #EF4444; text-align: center;
      margin-top: 8px; min-height: 20px;
    }
    .apishop-hint {
      font-size: 12px; color: #aeaeb2; text-align: center; margin-top: 10px;
    }
    .apishop-close {
      position: absolute; top: 16px; right: 16px;
      width: 28px; height: 28px; border: none; border-radius: 50%;
      background: #f5f5f7; cursor: pointer; display: flex;
      align-items: center; justify-content: center; transition: background 0.2s;
    }
    .apishop-close:hover { background: #e8e8ed; }
    .apishop-close svg { width: 14px; height: 14px; color: #86868b; }

    /* Balance display */
    .apishop-balance-box {
      text-align: center; padding: 20px; margin: 16px 0;
      border-radius: 16px; background: #f5f5f7;
    }
    .apishop-balance-label { font-size: 12px; color: #86868b; margin-bottom: 4px; }
    .apishop-balance-value { font-size: 36px; font-weight: 800; color: #0071E3; }
    .apishop-balance-unit { font-size: 14px; color: #86868b; }

    /* Package cards */
    .apishop-packages { display: flex; flex-direction: column; gap: 10px; }
    .apishop-pkg {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border: 1.5px solid #e5e5ea;
      border-radius: 14px; cursor: pointer; transition: all 0.2s;
      background: #fff;
    }
    .apishop-pkg:hover {
      border-color: #0071E3; background: #f0f7ff;
      transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,113,227,0.1);
    }
    .apishop-pkg-name { font-size: 15px; font-weight: 600; color: #1d1d1f; }
    .apishop-pkg-tokens { font-size: 12px; color: #86868b; margin-top: 2px; }
    .apishop-pkg-price { font-size: 18px; font-weight: 800; color: #0071E3; }
    .apishop-pkg-btn {
      width: 32px; height: 32px; border-radius: 10px; border: none;
      background: #0071E3; color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    .apishop-pkg-btn:hover { background: #0077ED; }

    /* Success state */
    .apishop-success {
      text-align: center; padding: 20px;
    }
    .apishop-success-icon {
      width: 56px; height: 56px; margin: 0 auto 14px;
      border-radius: 50%; background: #059669;
      display: flex; align-items: center; justify-content: center;
    }
    .apishop-success-icon svg { width: 28px; height: 28px; color: #fff; }
    .apishop-success-text { font-size: 16px; font-weight: 700; color: #1d1d1f; }
    .apishop-success-sub { font-size: 13px; color: #86868b; margin-top: 4px; }

    /* Loading spinner */
    .apishop-spinner {
      width: 20px; height: 20px; border: 2.5px solid #fff;
      border-top-color: transparent; border-radius: 50%;
      animation: apishop-spin 0.6s linear infinite;
      display: inline-block;
    }
    @keyframes apishop-spin { to { transform: rotate(360deg); } }

    /* Overview panel */
    .apishop-stat-grid {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 16px 0;
    }
    .apishop-stat-item {
      text-align: center; padding: 14px 8px; border-radius: 14px; background: #f5f5f7;
    }
    .apishop-stat-value { font-size: 20px; font-weight: 800; color: #1d1d1f; }
    .apishop-stat-value-blue { font-size: 20px; font-weight: 800; color: #0071E3; }
    .apishop-stat-value-green { font-size: 20px; font-weight: 800; color: #059669; }
    .apishop-stat-value-orange { font-size: 20px; font-weight: 800; color: #D97706; }
    .apishop-stat-label { font-size: 11px; color: #86868b; margin-top: 3px; }
    .apishop-progress-wrap { margin: 8px 0 4px; }
    .apishop-progress-bar {
      width: 100%; height: 8px; background: #e5e5ea; border-radius: 4px; overflow: hidden;
    }
    .apishop-progress-fill {
      height: 100%; border-radius: 4px; transition: width 0.6s ease;
      background: linear-gradient(90deg, #0071E3, #4F9CF7);
    }
    .apishop-progress-label {
      display: flex; justify-content: space-between; font-size: 11px; color: #86868b; margin-top: 4px;
    }
    .apishop-btn-group {
      display: flex; gap: 10px; margin-top: 16px;
    }
    .apishop-btn-group .apishop-btn { flex: 1; }
    .apishop-btn-outline {
      background: #fff; color: #0071E3; border: 1.5px solid #0071E3;
    }
    .apishop-btn-outline:hover { background: #f0f7ff; }
    .apishop-token-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 14px; border-radius: 12px; background: #f5f5f7; margin-top: 8px;
    }
    .apishop-token-label { font-size: 13px; color: #86868b; }
    .apishop-token-value { font-size: 14px; font-weight: 700; color: #1d1d1f; }
  `

  // SVG icons
  const ICONS = {
    logo: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>',
  }

  function injectStyles() {
    if (document.getElementById('apishop-styles')) return
    const el = document.createElement('style')
    el.id = 'apishop-styles'
    el.textContent = STYLES
    document.head.appendChild(el)
  }

  function createOverlay(contentHTML) {
    injectStyles()
    const overlay = document.createElement('div')
    overlay.className = 'apishop-overlay'
    overlay.innerHTML = `
      <div class="apishop-modal" style="position:relative;">
        <button class="apishop-close">${ICONS.close}</button>
        ${contentHTML}
      </div>
    `
    document.body.appendChild(overlay)
    overlay.querySelector('.apishop-close').onclick = () => {
      overlay.remove()
    }
    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove()
    })
    return overlay
  }

  class APIShop {
    constructor(options = {}) {
      this.serverUrl = (options.serverUrl || '').replace(/\/+$/, '')
      this.channel = options.channel || ''
      this._storageKey = `apishop_${this.channel}`
    }

    // ---- Public API ----
    async init() {
      // 1. 检查 localStorage 缓存
      const cached = this._getCachedAuth()
      if (cached && cached.userId) {
        // 有缓存，先展示概览面板
        await this._showOverviewPanel(cached.userId)
        return this._makeResult(cached.userId)
      }

      // 2. 无缓存，弹出登录
      const userId = await this._showLoginModal()

      // 3. 检查余额，不足则弹充值
      const balance = await this._checkBalance(userId)
      if (balance <= 0) {
        await this._showRechargeModal(userId)
      }

      return this._makeResult(userId)
    }

    // ---- Public: open overview panel only ----
    async openPanel() {
      const cached = this._getCachedAuth()
      if (cached && cached.userId) {
        await this._showOverviewPanel(cached.userId)
        return this._makeResult(cached.userId)
      }
      // 未登录，走完整 init 流程
      return this.init()
    }

    // ---- Overview Panel ----
    _showOverviewPanel(userId) {
      return new Promise((resolve) => {
        const overlay = createOverlay(`
          <div class="apishop-header">
            <div class="apishop-logo">${ICONS.logo}</div>
            <h2 class="apishop-title">余额</h2>
            <p class="apishop-subtitle" id="apishop-overview-email"></p>
          </div>
          <div class="apishop-body">
            <div class="apishop-stat-grid" id="apishop-overview-stats">
              <div class="apishop-stat-item">
                <div class="apishop-stat-value-blue" id="apishop-ov-purchased">--</div>
                <div class="apishop-stat-label">总购买 (元)</div>
              </div>
              <div class="apishop-stat-item">
                <div class="apishop-stat-value-orange" id="apishop-ov-used">--</div>
                <div class="apishop-stat-label">已使用 (元)</div>
              </div>
              <div class="apishop-stat-item">
                <div class="apishop-stat-value-green" id="apishop-ov-remaining">--</div>
                <div class="apishop-stat-label">剩余 (元)</div>
              </div>
            </div>

            <div class="apishop-progress-wrap">
              <div class="apishop-progress-bar">
                <div class="apishop-progress-fill" id="apishop-ov-progress" style="width: 0%"></div>
              </div>
              <div class="apishop-progress-label">
                <span id="apishop-ov-pct">0%</span>
                <span>已使用</span>
              </div>
            </div>

            <div class="apishop-error" id="apishop-overview-error"></div>
            <div class="apishop-btn-group">
              <button class="apishop-btn apishop-btn-blue" id="apishop-ov-recharge">充值</button>
              <button class="apishop-btn apishop-btn-outline" id="apishop-ov-close">关闭</button>
            </div>
            <div style="text-align:center;margin-top:12px;">
              <button id="apishop-ov-logout" style="background:none;border:none;font-size:12px;color:#aeaeb2;cursor:pointer;font-family:inherit;">退出账号</button>
            </div>
          </div>
        `)

        const purchasedEl = overlay.querySelector('#apishop-ov-purchased')
        const usedEl = overlay.querySelector('#apishop-ov-used')
        const remainingEl = overlay.querySelector('#apishop-ov-remaining')
        const progressEl = overlay.querySelector('#apishop-ov-progress')
        const pctEl = overlay.querySelector('#apishop-ov-pct')
        const tokRemainEl = overlay.querySelector('#apishop-ov-tok-remain')
        const errorEl = overlay.querySelector('#apishop-overview-error')
        const emailEl = overlay.querySelector('#apishop-overview-email')
        const rechargeBtn = overlay.querySelector('#apishop-ov-recharge')
        const closeBtn = overlay.querySelector('#apishop-ov-close')
        const logoutBtn = overlay.querySelector('#apishop-ov-logout')

        // Show cached email if available
        const cached = this._getCachedAuth()
        if (cached && cached.email) {
          emailEl.textContent = cached.email
        }

        // Load usage data
        this._fetchUsage(userId).then((data) => {
          const totalYuan = (data.totalPurchased / 10000).toFixed(2)
          const usedYuan = (data.totalUsed / 10000).toFixed(2)
          const remainYuan = (data.balance / 10000).toFixed(2)
          const pct = data.totalPurchased > 0
            ? Math.round((data.totalUsed / data.totalPurchased) * 100)
            : 0

          purchasedEl.textContent = totalYuan
          usedEl.textContent = usedYuan
          remainingEl.textContent = remainYuan
          progressEl.style.width = Math.min(pct, 100) + '%'
          pctEl.textContent = pct + '%'
          if (tokRemainEl) tokRemainEl.textContent = data.remainingTokens.toLocaleString()
        }).catch(() => {
          errorEl.textContent = '加载失败'
        })

        rechargeBtn.addEventListener('click', () => {
          overlay.remove()
          this._showRechargeModal(userId).then(() => resolve())
        })

        closeBtn.addEventListener('click', () => {
          overlay.remove()
          resolve()
        })

        logoutBtn.addEventListener('click', () => {
          overlay.remove()
          this._clearCache()
          // 退出后弹出登录
          this._showLoginModal().then((newUserId) => {
            resolve(newUserId)
          })
        })
      })
    }

    async _fetchUsage(userId) {
      const res = await fetch(`${this.serverUrl}/api/payment/end-user/usage`, {
        method: 'POST',
        headers: this._authHeaders(),
        body: JSON.stringify({ apiKey: this.channel, userId })
      })
      const data = await res.json()
      if (data.success) return data.data
      throw new Error(data.error || 'Failed to fetch usage')
    }

    // ---- Login Modal ----
    _showLoginModal() {
      return new Promise((resolve, reject) => {
        const overlay = createOverlay(`
          <div class="apishop-header">
            <div class="apishop-logo">${ICONS.logo}</div>
            <h2 class="apishop-title">登录 / 注册</h2>
            <p class="apishop-subtitle">验证邮箱即可开始使用</p>
          </div>
          <div class="apishop-body">
            <div class="apishop-input-group">
              <label class="apishop-label">邮箱地址</label>
              <div class="apishop-input-row">
                <input class="apishop-input" id="apishop-email" type="email"
                  placeholder="your@email.com" autocomplete="email">
                <button class="apishop-btn apishop-btn-send" id="apishop-send-btn">
                  发送验证码
                </button>
              </div>
            </div>
            <div class="apishop-input-group">
              <label class="apishop-label">验证码</label>
              <div class="apishop-code-inputs" id="apishop-code-inputs">
                <input class="apishop-code-digit" maxlength="1" data-idx="0">
                <input class="apishop-code-digit" maxlength="1" data-idx="1">
                <input class="apishop-code-digit" maxlength="1" data-idx="2">
                <input class="apishop-code-digit" maxlength="1" data-idx="3">
                <input class="apishop-code-digit" maxlength="1" data-idx="4">
                <input class="apishop-code-digit" maxlength="1" data-idx="5">
              </div>
            </div>
            <div class="apishop-error" id="apishop-error"></div>
            <button class="apishop-btn apishop-btn-blue apishop-btn-full" id="apishop-verify-btn" disabled>
              验证并登录
            </button>
            <div class="apishop-hint">首次登录自动注册账户</div>
          </div>
        `)

        const emailInput = overlay.querySelector('#apishop-email')
        const sendBtn = overlay.querySelector('#apishop-send-btn')
        const verifyBtn = overlay.querySelector('#apishop-verify-btn')
        const errorEl = overlay.querySelector('#apishop-error')
        const codeDigits = overlay.querySelectorAll('.apishop-code-digit')
        let testCode = ''
        let sending = false

        // 验证码输入框逻辑
        codeDigits.forEach((digit, i) => {
          digit.addEventListener('input', (e) => {
            const val = e.target.value.replace(/\D/g, '')
            e.target.value = val.slice(0, 1)
            if (val && i < 5) codeDigits[i + 1].focus()
            updateVerifyBtn()
          })
          digit.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !digit.value && i > 0) {
              codeDigits[i - 1].focus()
            }
          })
          digit.addEventListener('paste', (e) => {
            e.preventDefault()
            const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '')
            for (let j = 0; j < Math.min(text.length, 6); j++) {
              codeDigits[j].value = text[j]
            }
            if (text.length >= 6) codeDigits[5].focus()
            else if (text.length > 0) codeDigits[Math.min(text.length, 5)].focus()
            updateVerifyBtn()
            // 如果是测试模式验证码，自动填充
            if (text.length === 6) {
              setTimeout(() => verifyBtn.click(), 100)
            }
          })
        })

        function getCode() {
          return Array.from(codeDigits).map(d => d.value).join('')
        }
        function updateVerifyBtn() {
          verifyBtn.disabled = getCode().length < 6
        }

        // 发送验证码
        sendBtn.addEventListener('click', async () => {
          const email = emailInput.value.trim()
          if (!email || !email.includes('@')) {
            errorEl.textContent = '请输入有效的邮箱地址'
            return
          }
          if (sending) return
          sending = true
          sendBtn.disabled = true
          errorEl.textContent = ''

          try {
            const res = await fetch(`${this.serverUrl}/api/user/send-code`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, channel: this.channel })
            })
            const data = await res.json()
            if (data.success) {
              // 倒计时
              let sec = 60
              sendBtn.textContent = `${sec}s`
              const timer = setInterval(() => {
                sec--
                sendBtn.textContent = `${sec}s`
                if (sec <= 0) {
                  clearInterval(timer)
                  sendBtn.textContent = '重新发送'
                  sendBtn.disabled = false
                  sending = false
                }
              }, 1000)
              // 测试模式自动填充验证码
              if (data.testCode) {
                testCode = data.testCode
                for (let j = 0; j < 6; j++) {
                  codeDigits[j].value = testCode[j]
                }
                updateVerifyBtn()
                codeDigits[5].focus()
              } else {
                codeDigits[0].focus()
              }
            } else {
              errorEl.textContent = data.error || '发送失败'
              sendBtn.disabled = false
              sending = false
            }
          } catch (err) {
            errorEl.textContent = '网络错误'
            sendBtn.disabled = false
            sending = false
          }
        })

        // 验证并登录
        verifyBtn.addEventListener('click', async () => {
          const email = emailInput.value.trim()
          const code = getCode()
          if (code.length < 6) return

          verifyBtn.disabled = true
          verifyBtn.innerHTML = '<span class="apishop-spinner"></span>'
          errorEl.textContent = ''

          try {
            const res = await fetch(`${this.serverUrl}/api/user/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, code, channel: this.channel })
            })
            const data = await res.json()
            if (data.success) {
              // 缓存登录信息
              this._setCache(data.data)
              overlay.remove()
              resolve(data.data.userId)
            } else {
              errorEl.textContent = data.error || '验证失败'
              verifyBtn.disabled = false
              verifyBtn.textContent = '验证并登录'
            }
          } catch (err) {
            errorEl.textContent = '网络错误'
            verifyBtn.disabled = false
            verifyBtn.textContent = '验证并登录'
          }
        })

        emailInput.focus()
      })
    }

    // ---- Recharge Modal ----
    _showRechargeModal(userId) {
      return new Promise((resolve) => {
        let balance = 0

        const overlay = createOverlay(`
          <div class="apishop-header">
            <div class="apishop-logo">${ICONS.logo}</div>
            <h2 class="apishop-title">充值余额</h2>
            <p class="apishop-subtitle">微信扫码即可完成充值</p>
          </div>
          <div class="apishop-body">
            <div class="apishop-balance-box">
              <div class="apishop-balance-label">当前余额</div>
              <div class="apishop-balance-value" id="apishop-recharge-balance">0.00</div>
              <div class="apishop-balance-unit">元</div>
            </div>
            <div id="apishop-creating" style="text-align:center;padding:20px 0;">
              <div class="apishop-spinner" style="border-color:#0071E3;border-top-color:transparent;width:28px;height:28px;margin:0 auto 12px;"></div>
              <div style="font-size:15px;font-weight:600;color:#1d1d1f;">正在创建订单...</div>
              <div id="apishop-create-price" style="font-size:24px;font-weight:800;color:#0071E3;margin-top:8px;"></div>
            </div>
            <div class="apishop-qr-area" id="apishop-qr-area" style="display:none;text-align:center;padding:10px 0;">
              <div style="font-size:14px;font-weight:600;color:#1d1d1f;margin-bottom:10px;">微信扫码支付</div>
              <img id="apishop-qr-img" style="width:180px;height:180px;border-radius:12px;border:1px solid #f0f0f0;" />
              <div style="font-size:12px;color:#86868b;margin-top:8px;">支付金额：<span id="apishop-qr-price" style="font-weight:700;color:#07C160;">¥0</span></div>
              <div style="font-size:11px;color:#aeaeb2;margin-top:4px;">等待支付中...</div>
              <button id="apishop-qr-cancel" style="margin-top:10px;font-size:12px;color:#86868b;background:none;border:none;cursor:pointer;text-decoration:underline;">取消</button>
            </div>
            <div class="apishop-error" id="apishop-recharge-error"></div>
          </div>
        `)

        const balanceEl = overlay.querySelector('#apishop-recharge-balance')
        const errorEl = overlay.querySelector('#apishop-recharge-error')
        const creatingEl = overlay.querySelector('#apishop-creating')
        const priceEl = overlay.querySelector('#apishop-create-price')

        // 查询余额
        this._checkBalance(userId).then((bal) => {
          balance = bal
          balanceEl.textContent = (balance / 10000).toFixed(2)
        }).catch(() => {})

        // 自动获取套餐并创建订单
        const autoCreateOrder = async () => {
          try {
            // 获取套餐
            const pkgRes = await fetch(`${this.serverUrl}/api/payment/end-user/packages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ apiKey: this.channel })
            })
            const pkgData = await pkgRes.json()
            if (!pkgData.success || !pkgData.data || pkgData.data.length === 0) {
              errorEl.textContent = '该应用暂未配置套餐'
              creatingEl.style.display = 'none'
              return
            }
            const pkg = pkgData.data[0]
            priceEl.textContent = '¥' + (pkg.price / 10000).toFixed(2) + ' 元'

            // 创建微信支付订单
            const orderRes = await fetch(`${this.serverUrl}/api/payment/wechat/create`, {
              method: 'POST',
              headers: this._authHeaders(),
              body: JSON.stringify({
                apiKey: this.channel,
                userId: userId,
                packageId: pkg.id
              })
            })
            const orderData = await orderRes.json()

            if (!orderData.success || !orderData.data.codeUrl) {
              errorEl.textContent = orderData.error || '创建订单失败'
              creatingEl.style.display = 'none'
              return
            }

            // 隐藏创建中，显示二维码
            creatingEl.style.display = 'none'
            const qrArea = overlay.querySelector('#apishop-qr-area')
            const qrImg = overlay.querySelector('#apishop-qr-img')
            const qrPrice = overlay.querySelector('#apishop-qr-price')
            qrPrice.textContent = '¥' + (pkg.price / 10000).toFixed(2)
            qrArea.style.display = 'block'

            // 生成二维码图片
            qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(orderData.data.codeUrl)

            // 轮询订单状态
            const orderId = orderData.data.orderId
            const pollTimer = setInterval(async () => {
              try {
                const sr = await fetch(`${this.serverUrl}/api/payment/wechat/status?orderId=${orderId}`, {
                  headers: this._authHeaders()
                })
                const sd = await sr.json()
                if (sd.success && sd.data.status === 'completed') {
                  clearInterval(pollTimer)
                  balance = sd.data.balance
                  this._showSuccessInModal(overlay, pkg, balance, resolve)
                }
              } catch {}
            }, 3000)

            // 取消按钮
            overlay.querySelector('#apishop-qr-cancel').addEventListener('click', () => {
              clearInterval(pollTimer)
              overlay.remove()
              resolve()
            })
          } catch {
            errorEl.textContent = '网络错误，请重试'
            creatingEl.style.display = 'none'
          }
        }

        autoCreateOrder()
      })
    }

    _showSuccessInModal(overlay, pkg, newBalance, resolve) {
      const modal = overlay.querySelector('.apishop-modal')
      modal.innerHTML = `
        <button class="apishop-close">${ICONS.close}</button>
        <div class="apishop-success" style="padding:40px 28px;">
          <div class="apishop-success-icon">${ICONS.check}</div>
          <div class="apishop-success-text">充值成功</div>
          <div class="apishop-success-sub">${pkg.name}</div>
          <div style="margin-top:16px;">
            <div class="apishop-balance-box">
              <div class="apishop-balance-label">当前余额</div>
              <div class="apishop-balance-value">${(newBalance / 10000).toFixed(2)}</div>
              <div class="apishop-balance-unit">元</div>
            </div>
          </div>
          <button class="apishop-btn apishop-btn-blue apishop-btn-full" id="apishop-continue-btn" style="margin-top:16px;height:48px;border-radius:24px;font-size:16px;">
            开始使用
          </button>
        </div>
      `
      modal.querySelector('.apishop-close').onclick = () => {
        overlay.remove()
        resolve()
      }
      modal.querySelector('#apishop-continue-btn').addEventListener('click', () => {
        overlay.remove()
        resolve()
      })
    }

    // ---- API helpers ----
    _authHeaders() {
      const headers = { 'Content-Type': 'application/json' }
      const cached = this._getCachedAuth()
      if (cached && cached.token) {
        headers['x-user-token'] = cached.token
      }
      return headers
    }

    async _checkBalance(userId) {
      const res = await fetch(`${this.serverUrl}/api/payment/end-user/balance`, {
        method: 'POST',
        headers: this._authHeaders(),
        body: JSON.stringify({ apiKey: this.channel, userId })
      })
      const data = await res.json()
      if (data.success) return data.data.total
      throw new Error(data.error || 'Failed to check balance')
    }

    // ---- Storage ----
    _getCachedAuth() {
      try {
        const raw = localStorage.getItem(this._storageKey)
        return raw ? JSON.parse(raw) : null
      } catch { return null }
    }

    _setCache(data) {
      localStorage.setItem(this._storageKey, JSON.stringify(data))
    }

    _clearCache() {
      localStorage.removeItem(this._storageKey)
    }

    _makeResult(userId) {
      return {
        apiKey: this.channel,
        baseURL: `${this.serverUrl}/v1`,
        userId,
      }
    }
  }

  // Expose globally
  if (typeof window !== 'undefined') {
    window.APIShop = APIShop
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIShop
  }
})()
