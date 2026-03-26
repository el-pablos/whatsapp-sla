{{--
    WhatsApp Auth - Mobile First Interface
    Responsive QR + Pairing Code Authentication
    Based on OpenClaw Baileys Implementation Patterns
--}}

<!DOCTYPE html>
<html lang="id" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#075E54">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>WhatsApp SLA - Connect Device</title>

    {{-- PWA Manifest --}}
    <link rel="manifest" href="{{ asset('manifest.json') }}">

    {{-- Touch Icons --}}
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('icons/apple-touch-icon.png') }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('icons/favicon-32x32.png') }}">

    <style>
        /* Mobile-First Base Styles */
        * {
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }

        :root {
            --wa-green: #075E54;
            --wa-green-light: #128C7E;
            --wa-teal: #25D366;
            --wa-light-gray: #f0f2f5;
            --wa-dark: #111b21;
            --wa-text: #3b4a54;
            --touch-target: 48px;
            --safe-area-top: env(safe-area-inset-top, 0px);
            --safe-area-bottom: env(safe-area-inset-bottom, 0px);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: linear-gradient(135deg, var(--wa-green) 0%, var(--wa-green-light) 100%);
            color: var(--wa-text);
            padding-top: var(--safe-area-top);
            padding-bottom: var(--safe-area-bottom);
        }

        /* Container - Mobile First */
        .auth-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 16px;
        }

        /* Card - Mobile First */
        .auth-card {
            background: white;
            border-radius: 16px;
            width: 100%;
            max-width: 400px;
            padding: 24px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Header */
        .auth-header {
            text-align: center;
            margin-bottom: 24px;
        }

        .auth-logo {
            width: 64px;
            height: 64px;
            background: var(--wa-green);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
        }

        .auth-logo svg {
            width: 40px;
            height: 40px;
            fill: white;
        }

        .auth-title {
            font-size: 20px;
            font-weight: 600;
            color: var(--wa-dark);
            margin: 0 0 8px;
        }

        .auth-subtitle {
            font-size: 14px;
            color: var(--wa-text);
            margin: 0;
            line-height: 1.5;
        }

        /* Tab Navigation - Touch Optimized */
        .auth-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 24px;
        }

        .auth-tab {
            flex: 1;
            min-height: var(--touch-target);
            border: 2px solid var(--wa-light-gray);
            background: white;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            color: var(--wa-text);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .auth-tab:active {
            transform: scale(0.98);
        }

        .auth-tab.active {
            background: var(--wa-green);
            border-color: var(--wa-green);
            color: white;
        }

        .auth-tab svg {
            width: 20px;
            height: 20px;
        }

        /* QR Section */
        .qr-section {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .qr-container {
            width: 100%;
            max-width: 280px;
            aspect-ratio: 1;
            background: white;
            border: 3px solid var(--wa-light-gray);
            border-radius: 16px;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
            position: relative;
            overflow: hidden;
        }

        .qr-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 8px;
        }

        .qr-loading {
            position: absolute;
            inset: 0;
            background: var(--wa-light-gray);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }

        .qr-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--wa-light-gray);
            border-top-color: var(--wa-green);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .qr-status {
            font-size: 13px;
            color: var(--wa-text);
        }

        .qr-expired {
            background: rgba(255,255,255,0.95);
        }

        /* Pairing Section */
        .pairing-section {
            display: none;
        }

        .pairing-section.active {
            display: block;
        }

        .qr-section.active {
            display: flex;
        }

        .qr-section:not(.active) {
            display: none;
        }

        /* Input - Touch Optimized */
        .input-group {
            margin-bottom: 16px;
        }

        .input-label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: var(--wa-text);
            margin-bottom: 8px;
        }

        .input-field {
            width: 100%;
            min-height: var(--touch-target);
            padding: 12px 16px;
            font-size: 16px; /* Prevent zoom on iOS */
            border: 2px solid var(--wa-light-gray);
            border-radius: 12px;
            background: white;
            color: var(--wa-dark);
            transition: border-color 0.2s ease;
        }

        .input-field:focus {
            outline: none;
            border-color: var(--wa-green);
        }

        .input-field::placeholder {
            color: #adb5bd;
        }

        /* Phone Input with Country Code */
        .phone-input-wrapper {
            display: flex;
            gap: 8px;
        }

        .country-select {
            min-width: 80px;
            min-height: var(--touch-target);
            padding: 12px;
            font-size: 16px;
            border: 2px solid var(--wa-light-gray);
            border-radius: 12px;
            background: white;
            color: var(--wa-dark);
        }

        .phone-input {
            flex: 1;
        }

        /* Button - Touch Optimized */
        .btn {
            width: 100%;
            min-height: var(--touch-target);
            padding: 14px 24px;
            font-size: 16px;
            font-weight: 600;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .btn:active {
            transform: scale(0.98);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .btn-primary {
            background: var(--wa-green);
            color: white;
        }

        .btn-primary:hover:not(:disabled) {
            background: var(--wa-green-light);
        }

        .btn-secondary {
            background: var(--wa-light-gray);
            color: var(--wa-text);
        }

        .btn-loading .btn-text {
            display: none;
        }

        .btn-loading .btn-spinner {
            display: block;
        }

        .btn-spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        /* Status Messages */
        .status-message {
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 14px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .status-success {
            background: #d4edda;
            color: #155724;
        }

        .status-error {
            background: #f8d7da;
            color: #721c24;
        }

        .status-info {
            background: #e7f3ff;
            color: #0c5460;
        }

        .status-icon {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
        }

        /* Instructions */
        .instructions {
            background: var(--wa-light-gray);
            border-radius: 12px;
            padding: 16px;
            margin-top: 16px;
        }

        .instructions-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--wa-dark);
            margin: 0 0 12px;
        }

        .instructions-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .instructions-list li {
            font-size: 13px;
            color: var(--wa-text);
            padding: 6px 0;
            padding-left: 28px;
            position: relative;
            line-height: 1.4;
        }

        .instructions-list li::before {
            content: attr(data-step);
            position: absolute;
            left: 0;
            top: 6px;
            width: 20px;
            height: 20px;
            background: var(--wa-green);
            color: white;
            border-radius: 50%;
            font-size: 11px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Connection Status */
        .connection-status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px;
            font-size: 13px;
            color: var(--wa-text);
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ffc107;
        }

        .status-dot.connected {
            background: var(--wa-teal);
            animation: pulse 2s infinite;
        }

        .status-dot.disconnected {
            background: #dc3545;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        /* Success State */
        .success-state {
            text-align: center;
            padding: 32px 16px;
        }

        .success-icon {
            width: 80px;
            height: 80px;
            background: var(--wa-teal);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            animation: scaleIn 0.3s ease-out;
        }

        @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
        }

        .success-icon svg {
            width: 48px;
            height: 48px;
            fill: white;
        }

        .success-title {
            font-size: 20px;
            font-weight: 600;
            color: var(--wa-dark);
            margin: 0 0 8px;
        }

        .success-message {
            font-size: 14px;
            color: var(--wa-text);
            margin: 0 0 24px;
        }

        /* Footer */
        .auth-footer {
            text-align: center;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid var(--wa-light-gray);
        }

        .auth-footer-text {
            font-size: 12px;
            color: var(--wa-text);
        }

        .auth-footer a {
            color: var(--wa-green);
            text-decoration: none;
        }

        /* Tablet & Desktop */
        @media (min-width: 768px) {
            .auth-card {
                padding: 32px;
            }

            .auth-title {
                font-size: 24px;
            }

            .qr-container {
                max-width: 320px;
            }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
            :root {
                --wa-light-gray: #1f2c33;
                --wa-text: #8696a0;
            }

            body {
                background: linear-gradient(135deg, #0b141a 0%, #1f2c33 100%);
            }

            .auth-card {
                background: #202c33;
            }

            .auth-title, .instructions-title {
                color: #e9edef;
            }

            .input-field, .country-select {
                background: #1f2c33;
                border-color: #3b4a54;
                color: #e9edef;
            }

            .qr-container {
                background: #1f2c33;
                border-color: #3b4a54;
            }
        }

        /* Print styles - hide for printing */
        @media print {
            .auth-container {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="auth-container" role="main">
        <div class="auth-card" id="authCard">
            {{-- Header --}}
            <div class="auth-header">
                <div class="auth-logo" aria-hidden="true">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                </div>
                <h1 class="auth-title">Hubungkan WhatsApp</h1>
                <p class="auth-subtitle">Scan QR code atau masukkan kode pairing untuk menghubungkan perangkat</p>
            </div>

            {{-- Tab Navigation --}}
            <div class="auth-tabs" role="tablist">
                <button
                    class="auth-tab active"
                    id="tabQr"
                    role="tab"
                    aria-selected="true"
                    aria-controls="panelQr"
                    onclick="switchTab('qr')"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM19 19h2v2h-2zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM15 19h2v2h-2zM17 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2z"/>
                    </svg>
                    QR Code
                </button>
                <button
                    class="auth-tab"
                    id="tabPairing"
                    role="tab"
                    aria-selected="false"
                    aria-controls="panelPairing"
                    onclick="switchTab('pairing')"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                    </svg>
                    Kode Pairing
                </button>
            </div>

            {{-- QR Code Panel --}}
            <div class="qr-section active" id="panelQr" role="tabpanel" aria-labelledby="tabQr">
                <div class="qr-container" id="qrContainer">
                    {{-- QR Image will be inserted here --}}
                    <div class="qr-loading" id="qrLoading">
                        <div class="qr-spinner"></div>
                        <span class="qr-status">Memuat QR code...</span>
                    </div>
                    <img
                        src=""
                        alt="QR Code untuk menghubungkan WhatsApp"
                        class="qr-image"
                        id="qrImage"
                        style="display: none;"
                    >
                </div>

                <div class="connection-status" id="connectionStatus">
                    <span class="status-dot" id="statusDot"></span>
                    <span id="statusText">Menunggu scan...</span>
                </div>

                <button class="btn btn-secondary" onclick="refreshQr()" id="refreshBtn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                    <span class="btn-text">Refresh QR</span>
                    <div class="btn-spinner"></div>
                </button>

                <div class="instructions">
                    <h3 class="instructions-title">Cara scan QR:</h3>
                    <ol class="instructions-list">
                        <li data-step="1">Buka WhatsApp di HP Anda</li>
                        <li data-step="2">Tap Menu atau Settings</li>
                        <li data-step="3">Pilih "Linked Devices"</li>
                        <li data-step="4">Tap "Link a Device"</li>
                        <li data-step="5">Arahkan HP ke QR code ini</li>
                    </ol>
                </div>
            </div>

            {{-- Pairing Code Panel --}}
            <div class="pairing-section" id="panelPairing" role="tabpanel" aria-labelledby="tabPairing">
                <form id="pairingForm" onsubmit="submitPairing(event)">
                    <div class="input-group">
                        <label class="input-label" for="phoneNumber">Nomor WhatsApp</label>
                        <div class="phone-input-wrapper">
                            <select class="country-select" id="countryCode" aria-label="Kode negara">
                                <option value="+62">+62</option>
                                <option value="+1">+1</option>
                                <option value="+44">+44</option>
                                <option value="+65">+65</option>
                                <option value="+60">+60</option>
                            </select>
                            <input
                                type="tel"
                                class="input-field phone-input"
                                id="phoneNumber"
                                placeholder="812xxxxxxxx"
                                pattern="[0-9]{9,13}"
                                inputmode="numeric"
                                autocomplete="tel"
                                required
                            >
                        </div>
                    </div>

                    <div id="pairingCodeDisplay" style="display: none;">
                        <div class="status-message status-info">
                            <svg class="status-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                            </svg>
                            <div>
                                <strong>Kode Pairing:</strong>
                                <span id="pairingCodeText" style="font-family: monospace; font-size: 18px; letter-spacing: 2px;"></span>
                            </div>
                        </div>
                        <p style="font-size: 13px; color: var(--wa-text); margin: 8px 0 16px;">
                            Masukkan kode ini di WhatsApp > Linked Devices > Link with Phone Number
                        </p>
                    </div>

                    <button type="submit" class="btn btn-primary" id="pairingBtn">
                        <span class="btn-text">Dapatkan Kode Pairing</span>
                        <div class="btn-spinner"></div>
                    </button>
                </form>

                <div class="instructions">
                    <h3 class="instructions-title">Cara pairing dengan kode:</h3>
                    <ol class="instructions-list">
                        <li data-step="1">Masukkan nomor WhatsApp Anda di atas</li>
                        <li data-step="2">Klik "Dapatkan Kode Pairing"</li>
                        <li data-step="3">Buka WhatsApp > Linked Devices</li>
                        <li data-step="4">Pilih "Link with Phone Number"</li>
                        <li data-step="5">Masukkan kode yang muncul di layar</li>
                    </ol>
                </div>
            </div>

            {{-- Success State (hidden by default) --}}
            <div class="success-state" id="successState" style="display: none;">
                <div class="success-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                </div>
                <h2 class="success-title">Terhubung!</h2>
                <p class="success-message">WhatsApp berhasil dihubungkan ke sistem</p>
                <button class="btn btn-primary" onclick="window.location.href='{{ route('dashboard') }}'">
                    Lanjut ke Dashboard
                </button>
            </div>

            {{-- Footer --}}
            <div class="auth-footer">
                <p class="auth-footer-text">
                    WhatsApp SLA System v1.0<br>
                    <a href="{{ route('help') }}">Bantuan</a> |
                    <a href="{{ route('privacy') }}">Kebijakan Privasi</a>
                </p>
            </div>
        </div>
    </div>

    <script>
        // Configuration
        const CONFIG = {
            qrEndpoint: '{{ route("api.whatsapp.qr") }}',
            pairingEndpoint: '{{ route("api.whatsapp.pairing") }}',
            statusEndpoint: '{{ route("api.whatsapp.status") }}',
            csrfToken: '{{ csrf_token() }}',
            qrRefreshInterval: 30000, // 30 seconds
            statusCheckInterval: 2000, // 2 seconds
        };

        // State
        let currentTab = 'qr';
        let qrRefreshTimer = null;
        let statusCheckTimer = null;
        let isConnected = false;

        // Tab switching
        function switchTab(tab) {
            currentTab = tab;

            // Update tab buttons
            document.getElementById('tabQr').classList.toggle('active', tab === 'qr');
            document.getElementById('tabPairing').classList.toggle('active', tab === 'pairing');
            document.getElementById('tabQr').setAttribute('aria-selected', tab === 'qr');
            document.getElementById('tabPairing').setAttribute('aria-selected', tab === 'pairing');

            // Update panels
            document.getElementById('panelQr').classList.toggle('active', tab === 'qr');
            document.getElementById('panelPairing').classList.toggle('active', tab === 'pairing');

            // Trigger QR load if switching to QR tab
            if (tab === 'qr') {
                loadQr();
            }
        }

        // QR Code handling
        async function loadQr() {
            const loading = document.getElementById('qrLoading');
            const image = document.getElementById('qrImage');

            loading.style.display = 'flex';
            image.style.display = 'none';

            try {
                const response = await fetch(CONFIG.qrEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': CONFIG.csrfToken,
                    },
                });

                const data = await response.json();

                if (data.qrDataUrl) {
                    image.src = data.qrDataUrl;
                    image.style.display = 'block';
                    loading.style.display = 'none';

                    // Start status checking
                    startStatusCheck();

                    // Schedule QR refresh
                    scheduleQrRefresh();
                } else if (data.connected) {
                    showSuccess();
                } else {
                    showError(data.message || 'Gagal memuat QR code');
                }
            } catch (error) {
                console.error('QR load error:', error);
                loading.querySelector('.qr-status').textContent = 'Gagal memuat QR';
            }
        }

        function refreshQr() {
            const btn = document.getElementById('refreshBtn');
            btn.classList.add('btn-loading');
            btn.disabled = true;

            loadQr().finally(() => {
                btn.classList.remove('btn-loading');
                btn.disabled = false;
            });
        }

        function scheduleQrRefresh() {
            if (qrRefreshTimer) {
                clearTimeout(qrRefreshTimer);
            }
            qrRefreshTimer = setTimeout(() => {
                if (!isConnected && currentTab === 'qr') {
                    loadQr();
                }
            }, CONFIG.qrRefreshInterval);
        }

        // Status checking
        function startStatusCheck() {
            if (statusCheckTimer) {
                clearInterval(statusCheckTimer);
            }
            statusCheckTimer = setInterval(checkStatus, CONFIG.statusCheckInterval);
        }

        async function checkStatus() {
            try {
                const response = await fetch(CONFIG.statusEndpoint, {
                    headers: {
                        'X-CSRF-TOKEN': CONFIG.csrfToken,
                    },
                });

                const data = await response.json();
                updateConnectionStatus(data);

                if (data.connected) {
                    isConnected = true;
                    stopTimers();
                    showSuccess();
                }
            } catch (error) {
                console.error('Status check error:', error);
            }
        }

        function updateConnectionStatus(data) {
            const dot = document.getElementById('statusDot');
            const text = document.getElementById('statusText');

            if (data.connected) {
                dot.classList.add('connected');
                dot.classList.remove('disconnected');
                text.textContent = 'Terhubung!';
            } else if (data.error) {
                dot.classList.add('disconnected');
                dot.classList.remove('connected');
                text.textContent = data.error;
            } else {
                dot.classList.remove('connected', 'disconnected');
                text.textContent = 'Menunggu scan...';
            }
        }

        // Pairing code handling
        async function submitPairing(event) {
            event.preventDefault();

            const btn = document.getElementById('pairingBtn');
            const phoneNumber = document.getElementById('phoneNumber').value;
            const countryCode = document.getElementById('countryCode').value;
            const fullNumber = countryCode.replace('+', '') + phoneNumber;

            btn.classList.add('btn-loading');
            btn.disabled = true;

            try {
                const response = await fetch(CONFIG.pairingEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': CONFIG.csrfToken,
                    },
                    body: JSON.stringify({ phoneNumber: fullNumber }),
                });

                const data = await response.json();

                if (data.pairingCode) {
                    document.getElementById('pairingCodeText').textContent = data.pairingCode;
                    document.getElementById('pairingCodeDisplay').style.display = 'block';
                    btn.querySelector('.btn-text').textContent = 'Regenerate Kode';

                    // Start status checking
                    startStatusCheck();
                } else if (data.connected) {
                    showSuccess();
                } else {
                    showError(data.message || 'Gagal mendapatkan kode pairing');
                }
            } catch (error) {
                console.error('Pairing error:', error);
                showError('Terjadi kesalahan. Silakan coba lagi.');
            } finally {
                btn.classList.remove('btn-loading');
                btn.disabled = false;
            }
        }

        // Success handling
        function showSuccess() {
            stopTimers();
            document.getElementById('panelQr').style.display = 'none';
            document.getElementById('panelPairing').style.display = 'none';
            document.querySelector('.auth-tabs').style.display = 'none';
            document.getElementById('successState').style.display = 'block';

            // Haptic feedback if available
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }
        }

        // Error handling
        function showError(message) {
            // Create error toast
            const toast = document.createElement('div');
            toast.className = 'status-message status-error';
            toast.innerHTML = `
                <svg class="status-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span>${message}</span>
            `;

            const card = document.getElementById('authCard');
            card.insertBefore(toast, card.querySelector('.auth-header').nextSibling);

            // Remove after 5 seconds
            setTimeout(() => toast.remove(), 5000);
        }

        // Cleanup
        function stopTimers() {
            if (qrRefreshTimer) {
                clearTimeout(qrRefreshTimer);
                qrRefreshTimer = null;
            }
            if (statusCheckTimer) {
                clearInterval(statusCheckTimer);
                statusCheckTimer = null;
            }
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadQr();
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', stopTimers);

        // Handle visibility change (pause when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopTimers();
            } else if (!isConnected) {
                if (currentTab === 'qr') {
                    loadQr();
                }
            }
        });

        // Service Worker Registration for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.log('ServiceWorker registration failed:', err);
            });
        }
    </script>
</body>
</html>
