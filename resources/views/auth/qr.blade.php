<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>WhatsApp Authentication - {{ config('app.name', 'WhatsApp SLA') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />

    <!-- Styles -->
    <style>
        body { font-family: 'Inter', sans-serif; }
        .spinner {
            border: 2px solid #f3f3f3;
            border-top: 2px solid #25d366;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .status-connected { color: #25d366; }
        .status-connecting { color: #fbbf24; }
        .status-error { color: #ef4444; }
        .health-excellent { background-color: #dcfce7; color: #15803d; }
        .health-good { background-color: #fef3c7; color: #92400e; }
        .health-poor { background-color: #fee2e2; color: #dc2626; }
        .qr-container { min-height: 300px; display: flex; align-items: center; justify-content: center; border: 2px dashed #e5e7eb; border-radius: 8px; }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    <div class="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <!-- Header -->
            <div class="text-center">
                <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                    WhatsApp Authentication
                </h2>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Hubungkan akun WhatsApp untuk menggunakan bot SLA
                </p>
            </div>

            <!-- Status Card -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Status Koneksi</h3>
                        <div id="status-indicator" class="flex items-center space-x-2">
                            <div class="spinner" id="status-spinner" style="display: none;"></div>
                            <span id="status-text" class="text-sm font-medium">{{ ucfirst($status['status']) }}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-500 dark:text-gray-400">Status:</span>
                            <span id="connection-status" class="font-medium ml-1">{{ $status['status'] }}</span>
                        </div>
                        <div>
                            <span class="text-gray-500 dark:text-gray-400">Authenticated:</span>
                            <span id="auth-status" class="font-medium ml-1">{{ $status['authenticated'] ? 'Yes' : 'No' }}</span>
                        </div>
                        <div>
                            <span class="text-gray-500 dark:text-gray-400">Health Score:</span>
                            <span id="health-score" class="font-medium ml-1 px-2 py-1 rounded text-xs">
                                {{ $metrics['health_score'] ?? 0 }}/100
                            </span>
                        </div>
                        <div>
                            <span class="text-gray-500 dark:text-gray-400">Uptime:</span>
                            <span id="uptime" class="font-medium ml-1">{{ $metrics['uptime_minutes'] ?? 0 }}m</span>
                        </div>
                    </div>

                    @if($status['last_seen'])
                        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Last seen: {{ \Carbon\Carbon::parse($status['last_seen'])->diffForHumans() }}
                        </p>
                    @endif
                </div>
            </div>

            <!-- QR Code Section -->
            @if(!$status['authenticated'])
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div class="px-4 py-5 sm:p-6">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Scan QR Code</h3>

                        <div id="qr-container" class="qr-container bg-gray-50 dark:bg-gray-700 mb-4">
                            <div class="text-center">
                                <div class="spinner mb-2"></div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Generating QR code...</p>
                            </div>
                        </div>

                        <div class="flex space-x-3">
                            <button id="generate-qr" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out" onclick="generateQR()">
                                Generate QR
                            </button>
                            <button id="clear-session" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out" onclick="clearSession()">
                                Clear Session
                            </button>
                        </div>

                        <div class="mt-4 text-xs text-gray-500 dark:text-gray-400">
                            <p>1. Buka WhatsApp di ponsel Anda</p>
                            <p>2. Pilih Menu > Perangkat Tertaut</p>
                            <p>3. Scan QR code di atas</p>
                            <p>4. QR code berlaku selama {{ $qr_timeout }} detik</p>
                        </div>
                    </div>
                </div>

                <!-- Pairing Code Alternative -->
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div class="px-4 py-5 sm:p-6">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Alternatif: Pairing Code</h3>

                        <div class="flex space-x-2">
                            <input type="tel" id="phone-input" placeholder="+62812XXXXXXXX"
                                   class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <button id="request-pairing" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out" onclick="requestPairing()">
                                Request Code
                            </button>
                        </div>

                        <div id="pairing-result" class="mt-3" style="display: none;"></div>
                    </div>
                </div>
            @else
                <!-- Already Connected -->
                <div class="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <div class="flex">
                        <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-green-800 dark:text-green-200">WhatsApp Connected</h3>
                            <p class="mt-1 text-sm text-green-700 dark:text-green-300">Your WhatsApp is successfully connected and ready to use.</p>
                            <div class="mt-3 flex space-x-3">
                                <a href="{{ route('dashboard') }}" class="text-sm font-medium text-green-800 dark:text-green-200 hover:text-green-600 dark:hover:text-green-400">
                                    Go to Dashboard →
                                </a>
                                <button onclick="logout()" class="text-sm font-medium text-red-600 hover:text-red-500">
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            @endif
        </div>
    </div>

    <!-- Scripts -->
    <script>
        let pollingInterval;
        let qrPollingInterval;

        // CSRF Token
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        // Auto-refresh status every 5 seconds
        pollingInterval = setInterval(refreshStatus, 5000);

        // Refresh status on load
        refreshStatus();

        function refreshStatus() {
            fetch('/api/baileys/status', {
                headers: {
                    'Authorization': 'Bearer {{ auth()->user()?->createToken("temp")->plainTextToken ?? "" }}',
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateStatus(data.data);

                    // Reload page if connected
                    if (data.data.authenticated && data.data.status === 'open') {
                        window.location.reload();
                    }
                }
            })
            .catch(error => console.error('Status refresh failed:', error));
        }

        function updateStatus(status) {
            document.getElementById('connection-status').textContent = status.status;
            document.getElementById('auth-status').textContent = status.authenticated ? 'Yes' : 'No';
            document.getElementById('health-score').textContent = status.health_score + '/100';
            document.getElementById('uptime').textContent = status.uptime_minutes + 'm';

            const statusText = document.getElementById('status-text');
            const statusSpinner = document.getElementById('status-spinner');

            statusText.className = 'text-sm font-medium ';

            if (status.status === 'open' && status.authenticated) {
                statusText.className += 'status-connected';
                statusSpinner.style.display = 'none';
            } else if (status.status === 'connecting') {
                statusText.className += 'status-connecting';
                statusSpinner.style.display = 'inline-block';
            } else {
                statusText.className += 'status-error';
                statusSpinner.style.display = 'none';
            }

            // Update health score styling
            const healthElement = document.getElementById('health-score');
            healthElement.className = 'font-medium ml-1 px-2 py-1 rounded text-xs ';

            if (status.health_score >= 80) {
                healthElement.className += 'health-excellent';
            } else if (status.health_score >= 50) {
                healthElement.className += 'health-good';
            } else {
                healthElement.className += 'health-poor';
            }
        }

        function generateQR() {
            const button = document.getElementById('generate-qr');
            const container = document.getElementById('qr-container');

            button.disabled = true;
            button.textContent = 'Generating...';

            container.innerHTML = `
                <div class="text-center">
                    <div class="spinner mb-2"></div>
                    <p class="text-sm text-gray-500">Generating QR code...</p>
                </div>
            `;

            fetch('/api/baileys/qr/request', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer {{ auth()->user()?->createToken("temp")->plainTextToken ?? "" }}',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Start polling for QR code
                    startQRPolling();
                } else {
                    container.innerHTML = `<p class="text-red-500 text-sm">${data.message}</p>`;
                }
            })
            .catch(error => {
                console.error('QR generation failed:', error);
                container.innerHTML = '<p class="text-red-500 text-sm">Failed to generate QR code</p>';
            })
            .finally(() => {
                button.disabled = false;
                button.textContent = 'Generate QR';
            });
        }

        function startQRPolling() {
            qrPollingInterval = setInterval(checkQR, 2000);

            // Stop after timeout
            setTimeout(() => {
                if (qrPollingInterval) {
                    clearInterval(qrPollingInterval);
                    document.getElementById('qr-container').innerHTML =
                        '<p class="text-gray-500 text-sm">QR code expired. Click Generate QR to try again.</p>';
                }
            }, {{ $qr_timeout * 1000 }});
        }

        function checkQR() {
            fetch('/api/baileys/qr', {
                headers: {
                    'Authorization': 'Bearer {{ auth()->user()?->createToken("temp")->plainTextToken ?? "" }}',
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data.qr_code) {
                    document.getElementById('qr-container').innerHTML = `
                        <div class="text-center">
                            <img src="data:image/png;base64,${data.data.qr_code}" alt="QR Code" class="mx-auto max-w-full h-auto">
                            <p class="text-xs text-gray-500 mt-2">Expires in ${data.data.expires_in_seconds} seconds</p>
                        </div>
                    `;

                    // Clear polling when QR is shown
                    if (qrPollingInterval) {
                        clearInterval(qrPollingInterval);
                    }
                }
            })
            .catch(error => console.error('QR check failed:', error));
        }

        function requestPairing() {
            const phoneInput = document.getElementById('phone-input');
            const button = document.getElementById('request-pairing');
            const result = document.getElementById('pairing-result');

            if (!phoneInput.value) {
                alert('Please enter phone number');
                return;
            }

            button.disabled = true;
            button.textContent = 'Requesting...';

            fetch('/api/baileys/pairing', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer {{ auth()->user()?->createToken("temp")->plainTextToken ?? "" }}',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({ phone: phoneInput.value })
            })
            .then(response => response.json())
            .then(data => {
                result.style.display = 'block';
                if (data.success) {
                    result.innerHTML = `
                        <div class="bg-green-50 border border-green-200 rounded-md p-3">
                            <p class="text-sm text-green-800">${data.message}</p>
                            ${data.data.code ? `<p class="text-lg font-mono font-bold text-green-900 mt-1">${data.data.code}</p>` : ''}
                        </div>
                    `;
                } else {
                    result.innerHTML = `
                        <div class="bg-red-50 border border-red-200 rounded-md p-3">
                            <p class="text-sm text-red-800">${data.message}</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Pairing request failed:', error);
                result.style.display = 'block';
                result.innerHTML = `
                    <div class="bg-red-50 border border-red-200 rounded-md p-3">
                        <p class="text-sm text-red-800">Request failed</p>
                    </div>
                `;
            })
            .finally(() => {
                button.disabled = false;
                button.textContent = 'Request Code';
            });
        }

        function clearSession() {
            if (!confirm('Are you sure you want to clear the session?')) return;

            fetch('/api/baileys/logout', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer {{ auth()->user()?->createToken("temp")->plainTextToken ?? "" }}',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    window.location.reload();
                } else {
                    alert('Failed: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Clear session failed:', error);
                alert('Failed to clear session');
            });
        }

        function logout() {
            clearSession();
        }

        // Cleanup intervals on page unload
        window.addEventListener('beforeunload', () => {
            if (pollingInterval) clearInterval(pollingInterval);
            if (qrPollingInterval) clearInterval(qrPollingInterval);
        });
    </script>
</body>
</html>