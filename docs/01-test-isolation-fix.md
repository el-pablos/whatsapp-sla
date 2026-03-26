# Bug Fix: Test Isolation Issues - ChatTest & ChatApiTest

## Tanggal
2026-03-26

## Deskripsi Bug
Test failures karena database isolation issue:
- `tests/Unit/Models/ChatTest.php:75` - scopeActive expected 2, actual 5
- `tests/Feature/Api/ChatApiTest.php:65` - chats count expected 1, actual 4

## Root Cause Analysis
Meskipun `Tests\TestCase` sudah memiliki `use RefreshDatabase` trait, binding Pest di `Pest.php` hanya menggunakan:
```php
uses(Tests\TestCase::class)->in('Feature');
uses(Tests\TestCase::class)->in('Unit');
```

Trait `RefreshDatabase` dari TestCase tidak secara eksplisit di-inherit melalui Pest binding. Hal ini menyebabkan test di subfolder (`Unit/Models/`, `Feature/Api/`) tidak mendapat proper database isolation.

## Solusi
Menambahkan `RefreshDatabase::class` secara eksplisit ke Pest binding:
```php
uses(TestCase::class, RefreshDatabase::class)->in('Feature');
uses(TestCase::class, RefreshDatabase::class)->in('Unit');
```

## Files Affected
| File | Baris | Perubahan |
|------|-------|-----------|
| tests/Pest.php | 19-20 | Tambah RefreshDatabase trait ke uses() |

## Impact Analysis
- Semua test di `tests/Feature/` dan subfolder: mendapat proper database isolation
- Semua test di `tests/Unit/` dan subfolder: mendapat proper database isolation
- Tidak ada breaking change karena ini hanya memastikan trait sudah ter-apply

## Testing
### Test Cases Executed

| Test ID | Nama | Status |
|---------|------|--------|
| TC-001 | ChatTest - scopeActive filters non-resolved chats | PASSED |
| TC-002 | ChatTest - scopeNeedsAttention filters bot chats | PASSED |
| TC-003 | ChatTest - scopeHandledBy filters chats by user | PASSED |
| TC-004 | ChatTest - scopeByStatus filters by status | PASSED |
| TC-005 | ChatApiTest - creates new chat | PASSED |
| TC-006 | ChatApiTest - updates existing chat | PASSED |
| TC-007 | ChatApiTest - validates required fields | PASSED |
| TC-008 | ChatApiTest - validates status enum | PASSED |

### Full Test Suite
```
Tests:    217 passed (487 assertions)
Duration: 7.91s
```

### Consistency Check
Test dijalankan 3 kali dengan random order seed berbeda, semua PASSED:
- Run 1: 30 passed (seed: 1774494756)
- Run 2: 30 passed (seed: 1774494758)
- Run 3: 30 passed (seed: 1774494760)

## Unit Test Results
Total test cases: 30
Passed: 30
Failed: 0
Hasil: 100% PASSED

## Backup Location
- Backup: `backup-files/01-test-isolation-fix/Pest.php`
- Fixed: `fixed-files/01-test-isolation-fix/Pest.php`

## Lessons Learned
1. Pest binding `uses()->in()` membutuhkan trait yang eksplisit ditambahkan meskipun TestCase sudah meng-include trait tersebut
2. Saat menggunakan Pest dengan PHPUnit traits, sebaiknya trait ditambahkan langsung ke `uses()` daripada mengandalkan inheritance dari base TestCase
