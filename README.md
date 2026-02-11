<p align="center">
  <a href="https://www.instagram.com/codebym_" target="_blank">
    <img src="https://img.shields.io/badge/Built%20by-Codebym-00bcd4?style=for-the-badge" alt="Built by Codebym">
  </a>
</p>

# Ramadan Reservation System

**Language**  
[English](#english) | [Türkçe](#türkçe)

---

## English

### Overview

Ramadan Reservation System is a fully static, single-page web application built with Vanilla JavaScript and Supabase.  
It is designed to manage restaurant reservations with automatic table assignment logic and role-based access control.  
There is no custom backend server; all data operations are handled directly via Supabase.

### Features

- Reservation create, update, delete
- Automatic table assignment algorithm
- Table availability and occupancy view
- Role-based UI (developer / manager)
- Supabase authentication (email & password)
- Audit logs (developer only)
- Single-page application (no build step)

### Architecture

- Frontend-only application (HTML, CSS, Vanilla JS)
- Supabase as backend (PostgreSQL, Auth, RPC, RLS)
- Business logic split between frontend and SQL RPC functions
- Security enforced primarily through Supabase RLS policies

### Technologies

- Vanilla JavaScript
- HTML5, CSS3
- Bootstrap 5 (CDN)
- Supabase (PostgreSQL, Auth, RLS, RPC)

### Project Structure

```text
root/
├── index.html
├── app.js
├── styles.css
```
### Notes
Table assignment logic exists both in frontend and SQL functions

Reservation model is currently day-based

UI rendering uses innerHTML; sanitization is recommended

Supabase RLS configuration is critical for proper security

### License
This project is licensed under a Source-Available License (Non-Commercial).

Copyright (c) 2026 CodeByM

The software may be used, copied, modified, and distributed
for non-commercial purposes only.

Commercial use is prohibited without explicit permission.

Attribution must be preserved.

The software is provided "as is", without warranty.

For commercial licensing, please contact CodeByM.
See the LICENSE file for the full license text.

## Türkçe
### Genel Bakış
Ramazan Rezervasyon Sistemi, Vanilla JavaScript ve Supabase kullanılarak geliştirilmiş, tamamen statik bir rezervasyon uygulamasıdır.
Otomatik masa atama algoritması ve rol bazlı erişim kontrolü içerir.
Uygulamada geleneksel bir backend sunucusu bulunmaz; tüm veri işlemleri Supabase üzerinden yürütülür.

### Özellikler
Rezervasyon ekleme, düzenleme, silme

Otomatik masa atama algoritması

Doluluk ve müsaitlik görüntüleme

Rol bazlı arayüz (developer / manager)

Supabase kimlik doğrulama

Audit log sistemi

Tek sayfa uygulama (build yok)

### Mimari
Frontend tabanlı mimari (HTML, CSS, Vanilla JS)

Backend olarak Supabase (PostgreSQL, RLS, RPC)

İş kuralları frontend ve SQL fonksiyonları arasında paylaşılmıştır

Güvenlik Supabase RLS policy’lerine dayanır

### Lisans
Bu proje Source-Available (Ticari Olmayan) lisans ile sunulmaktadır.

Copyright (c) 2026 CodeByM

Yazılım yalnızca ticari olmayan amaçlarla kullanılabilir.

Ticari kullanım için CodeByM ile iletişime geçilmelidir.

Telif hakkı ve lisans bildirimi korunmalıdır.

Yazılım “olduğu gibi” sunulur ve garanti içermez.

Detaylı lisans metni için LICENSE dosyasına bakınız.

---

<p align="center">
  Designed & Built by <strong><a href="https://www.instagram.com/codebym_" target="_blank">Codebym</a></strong>
</p>
