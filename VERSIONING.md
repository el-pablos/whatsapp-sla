# Versioning Strategy - WhatsApp SLA

## Semantic Versioning (SemVer)

Project ini mengikuti [Semantic Versioning 2.0.0](https://semver.org/) dengan format `MAJOR.MINOR.PATCH`.

### Format: `vMAJOR.MINOR.PATCH`

```
v1.2.3
│ │ │
│ │ └── PATCH version (bug fixes, security patches)
│ └──── MINOR version (new features, backward compatible)
└────── MAJOR version (breaking changes)
```

## Kapan Bump Version?

### MAJOR Version (Breaking Changes)
Increment ketika ada perubahan yang tidak backward compatible:
- Hapus atau ubah public API yang sudah ada
- Ganti struktur database yang fundamental
- Ubah format response API yang sudah existing
- Remove deprecated features yang sudah ada warning

**Contoh:**
- `v1.5.3` → `v2.0.0` (Migration dari WA Business API ke Baileys)
- `v2.3.1` → `v3.0.0` (Remove Laravel Sanctum, ganti ke custom auth)

### MINOR Version (New Features)
Increment ketika menambah fitur baru yang backward compatible:
- Tambah endpoint API baru
- Tambah fitur baru di dashboard
- Tambah optional parameter pada fungsi existing
- Tambah table database baru tanpa mengubah yang lama

**Contoh:**
- `v1.5.3` → `v1.6.0` (Tambah fitur SLA monitoring dashboard)
- `v2.1.0` → `v2.2.0` (Tambah bulk message sending feature)

### PATCH Version (Bug Fixes)
Increment untuk bug fixes dan improvements kecil:
- Perbaiki bug tanpa mengubah API
- Security patches
- Performance improvements
- Update dependencies
- Fix typos di dokumentasi

**Contoh:**
- `v1.5.3` → `v1.5.4` (Fix bug session timeout)
- `v2.1.0` → `v2.1.1` (Security patch for JWT validation)

## Pre-release Versions

### Alpha (`-alpha.N`)
- Fitur belum lengkap
- Testing internal only
- Highly unstable
- **Contoh:** `v2.0.0-alpha.1`

### Beta (`-beta.N`)
- Fitur lengkap tapi mungkin ada bugs
- Testing dengan selected users
- Feature freeze
- **Contoh:** `v2.0.0-beta.1`

### Release Candidate (`-rc.N`)
- Siap untuk production testing
- No new features, hanya bug fixes
- Final testing sebelum release
- **Contoh:** `v2.0.0-rc.1`

## Release Timeline

```
v1.0.0-alpha.1    ← Initial Baileys implementation
v1.0.0-alpha.2    ← QR authentication complete
v1.0.0-alpha.3    ← Pairing code authentication
v1.0.0-beta.1     ← Feature complete, testing phase
v1.0.0-beta.2     ← Bug fixes from testing
v1.0.0-rc.1       ← Release candidate
v1.0.0            ← Production release
```

## Auto-tagging Strategy

### Automatic Version Bumps
File `.github/workflows/auto-tag.yml` otomatis create tags berdasarkan commit message:

**MAJOR bump triggers:**
- Commit message contains: `BREAKING`, `major`
- Example: `"feat: BREAKING migrate to Baileys API"`

**MINOR bump triggers:**
- Commit message contains: `feat`, `feature`, `minor`
- Example: `"feat: tambah dashboard SLA monitoring"`

**PATCH bump (default):**
- Semua commit lainnya
- Example: `"fix: perbaiki bug session reconnection"`

### Manual Tagging
Untuk release khusus, buat tag manual:

```bash
# Create release tag
git tag -a v1.0.0 -m "Production release v1.0.0 - Baileys WhatsApp SLA"
git push origin v1.0.0

# Create pre-release tag
git tag -a v1.1.0-beta.1 -m "Beta release v1.1.0-beta.1 - New analytics features"
git push origin v1.1.0-beta.1
```

## Release Notes Format

Setiap release otomatis generate release notes dengan format:

```markdown
# Release Notes v1.0.0

## WhatsApp SLA - Baileys Migration Release

### 🚀 Fitur Utama
- Complete migration dari WA Business API ke Baileys
- QR code authentication untuk koneksi WhatsApp
- Session persistence dengan auto-reconnection

### 📊 System Improvements
- SLA monitoring dengan real-time metrics
- Performance analytics dashboard

### 🔧 Technical Changes
- commit 1 summary
- commit 2 summary

### ✅ Testing Coverage
- Unit tests: 100% coverage
- Integration tests: WhatsApp connection flow
- E2E tests: Complete user journey

### 📚 Documentation
- Complete API documentation
- Setup guide untuk development
```

## Branch-to-Version Mapping

| Branch | Version Type | Example |
|--------|-------------|----------|
| `main` | Stable releases | `v1.0.0`, `v1.1.0` |
| `develop` | Pre-releases | `v1.1.0-beta.1` |
| `feature/*` | Alpha builds | `v1.1.0-alpha.1` |
| `hotfix/*` | Patch releases | `v1.0.1`, `v1.0.2` |

## Deployment Strategy

### Production Releases
- **Trigger:** Tag dengan format `v*.*.*` (stable version)
- **Target:** Production environment
- **Requirements:** All tests pass + manual QA approval

### Staging Releases
- **Trigger:** Push to `develop` branch
- **Target:** Staging environment
- **Requirements:** All tests pass

### Development Releases
- **Trigger:** Push to `feature/*` branches
- **Target:** Development environment
- **Requirements:** Basic CI checks pass

## Version Control Commands

```bash
# Check current version
npm version --no-git-tag-version
cat package.json | grep version

# View all tags
git tag --sort=-version:refname

# View release history
git log --oneline --graph --decorate --tags

# Compare versions
git log v1.0.0..v1.1.0 --oneline

# Rollback to specific version
git checkout v1.0.0
```

## Compatibility Matrix

| Version | Laravel | PHP | Node.js | Baileys |
|---------|---------|-----|---------|---------|
| v1.x.x  | 12.x    | 8.2+ | 20+     | Latest  |
| v2.x.x  | 12.x    | 8.3+ | 22+     | Latest  |

## Migration Guide

Ketika ada breaking changes (MAJOR version), selalu sediakan migration guide di:
- `docs/migrations/v1-to-v2.md`
- `docs/migrations/v2-to-v3.md`

## Security Policy

- **Security patches:** Langsung ke PATCH version
- **Critical vulnerabilities:** Emergency hotfix dengan PATCH bump
- **Security advisories:** Publish di GitHub Security tab

---

**Last Updated:** 2026-03-26
**Version:** 1.0.0
**Maintainer:** el-pablos