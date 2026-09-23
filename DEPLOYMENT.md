# Progoti Shikkha Backend — Render Deployment

## Build
- Runtime: Node.js
- Install: `npm install`
- Build: `npm run build`
- Start: `npm start`
- Health: `/api/v1/health`

## Required environment variables
Use `.env.example` as the complete reference. At minimum configure:
```
NODE_ENV=production
PORT=10000
CLIENT_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
MONGODB_URI=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
COOKIE_SECRET=...
RESEND_API_KEY=...
EMAIL_FROM=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
DONATION_PERCENTAGE=10
DONATION_BKASH_NUMBER=YOUR-BKASH-NUMBER
```

`render.yaml` already defines the service build/start/health-check configuration and keeps production secrets as Render-managed environment variables.

## Business logic implemented
- Student, tutor, admin roles only.
- Existing `TuitionPost.student` structure remains unchanged.
- Existing tutor matching/application/hire flow remains.
- User-to-user phone/WhatsApp exposure is blocked at the API layer.
- Manual student/tutor verification is controlled by admin.
- A first-month donation record is created when a tutor is hired.
- The donation becomes payable only after admin marks first-month salary as received.
- Donation amount is calculated server-side from the configured percentage.
- bKash transaction ID submission is available to tutors.
- Admin verifies, reminds, marks overdue, and can suspend the tutor for non-payment.
