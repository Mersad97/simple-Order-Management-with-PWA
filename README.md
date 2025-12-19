# Offline Order Management PWA

**Raw HTML / CSS / JavaScript + Node.js (ESM)**

این پروژه تمرینی یک **PWA آفلاین‌فرست** برای مدیریت سفارش‌هاست که امکان ثبت سفارش در حالت آفلاین، ذخیره در IndexedDB، و ارسال خودکار سفارش‌ها به سرور پس از آنلاین شدن را فراهم می‌کند.

---

## قابلیت‌ها

- ثبت سفارش آفلاین
- ذخیره سفارش‌ها در IndexedDB
- صف Outbox برای درخواست‌های ارسال‌نشده
- ارسال خودکار Outbox با Background Sync
- Fallback برای مرورگرهای بدون Background Sync
- Service Worker حرفه‌ای:
  - precache
  - runtime caching
  - offline fallback page
- Telemetry آفلاین + ارسال batch
- همگام‌سازی بین چند تب (BroadcastChannel)
- مدیریت idempotency برای جلوگیری از ارسال تکراری

---

## پیش‌نیازها

- Node.js نسخه **18+**
- npm
- مرورگر مدرن (Chrome / Edge پیشنهاد می‌شود)

> ⚠️ Service Worker فقط روی:
>
> - `https://...`
> - `http://localhost`
>
> فعال می‌شود  
> روی IP شبکه مثل `http://192.168.x.x` با HTTP کار نمی‌کند.

---

## ساختار پروژه (نمونه)

```text
project/
├─ server/
│  ├─ package.json
│  └─ src/
│     ├─ index.js
│     ├─ routes/
│     └─ data/
│
└─ frontend/
   ├─ index.html
   ├─ offline.html
   ├─ sw.js
   ├─ app.js
   ├─ manifest.webmanifest
   ├─ css/
   │  └─ styles.css
   └─ js/
      ├─ db.js
      ├─ order.js
      ├─ telemetry.js
      ├─ multiTab.js
      ├─ utils.js
      └─ modalBox.js
```

## اجرای پروژه از صفر (Development)

1- نصب وابستگی‌های بک‌اند

> `cd server` >`npm install`

2- اجرای بک‌اند

طبق تنظیم پروژه:

> `npm run dev`

## پس از اجرا باید این آدرس‌ها کار کنند:

`http://localhost:3000/api/config`

`http://localhost:3000/api/orders`

اگر باز نشدند:

سرور بالا نیست

پورت اشتباه است

یا routeها درست mount نشده‌اند

### اجرای فرانت‌اند با http-server

روش پیشنهادی (بدون نصب global)

> `cd ../frontend` >`npx http-server . -p 8080 -c-1`

سپس در مرورگر باز کن:

`http://localhost:8080`

اگر sw.js یا offline.html خطای 404 داد:

http-server را از فولدر اشتباه اجرا کرده‌ای

یا فایل‌ها در مسیر درست نیستند
