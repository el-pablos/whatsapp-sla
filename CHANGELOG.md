# Changelog

Semua perubahan penting pada project WhatsApp SLA akan didokumentasikan di file ini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Ditambahkan
- Setup release automation workflow untuk GitHub Actions
- Auto-tagging berdasarkan commit message conventions
- VERSIONING.md dokumentasi semantic versioning strategy
- Release notes generation otomatis dengan format standar

## [1.0.0-alpha.1] - 2026-03-26

### Ditambahkan
- **Baileys Integration:** Complete migration dari WA Business API ke Baileys
- **QR Code Authentication:** Login WhatsApp via QR code scanning
- **Pairing Code Authentication:** Alternatif login dengan pairing code untuk WhatsApp Web
- **Session Persistence:** Auto-save dan reload session state
- **Reconnection Strategy:** Robust reconnection dengan exponential backoff
- **Health Monitoring:** Endpoint healthcheck untuk monitoring koneksi

### Arsitektur
- Laravel 12.x dengan Octane untuk high-performance
- React 19 frontend dengan Inertia.js
- Tailwind CSS 4.0 untuk styling
- TypeScript untuk type safety
- Spatie Permission untuk RBAC

### Technical Details
- BaileysService sebagai core WhatsApp client
- Event-driven architecture dengan Laravel Events
- Queue-based message processing
- Real-time connection status monitoring

### Testing
- Unit tests untuk auth modules (QR, pairing, reconnect)
- Integration tests untuk backend services
- E2E tests untuk complete user flows
- Performance tests untuk load handling

### Documentation
- API documentation lengkap
- Setup guide untuk development
- Deployment guide untuk production
- Troubleshooting guide

### Security
- Session encryption untuk WhatsApp credentials
- Rate limiting pada API endpoints
- Input validation pada semua user inputs
- Secure WebSocket communication

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0-alpha.1 | 2026-03-26 | Initial Baileys integration |
| [Future] 1.0.0-beta.1 | TBD | Feature complete, testing phase |
| [Future] 1.0.0-rc.1 | TBD | Release candidate |
| [Future] 1.0.0 | TBD | Production release |

---

**Maintained by:** el-pablos
**Last Updated:** 2026-03-26