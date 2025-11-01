# Production Deployment Checklist

## Pre-Launch

### Firebase Configuration

- [ ] Production project created on Firebase Console
- [ ] Authentication enabled:
  - [ ] Email/Password provider
  - [ ] Google provider
  - [ ] Email templates customized (Czech language)
- [ ] Firestore Database created
  - [ ] Security rules deployed (`firebase deploy --only firestore:rules`)
  - [ ] Indexes created (check Firestore console for auto-suggestions)
- [ ] Firebase Storage enabled
  - [ ] Security rules deployed (`firebase deploy --only storage:rules`)
  - [ ] CORS configuration set
- [ ] Firebase Billing enabled (Blaze plan)
  - [ ] Spending limits configured
  - [ ] Alerts set up
- [ ] Authorized domains added:
  - [ ] claimbuddy.cz
  - [ ] claimbuddy.vercel.app
  - [ ] localhost (for development)

### Vercel Deployment

- [ ] Project created on Vercel
- [ ] GitHub repository connected
- [ ] Environment variables configured:
  - [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
  - [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
  - [ ] `GOOGLE_GEMINI_API_KEY`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_PUBLISHABLE_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `GOPAY_CLIENT_ID`
  - [ ] `GOPAY_CLIENT_SECRET`
  - [ ] `RESEND_API_KEY`
  - [ ] `RESEND_FROM_EMAIL`
  - [ ] `NEXT_PUBLIC_APP_URL`
- [ ] Custom domain configured (claimbuddy.cz)
- [ ] SSL certificate active
- [ ] Analytics enabled
- [ ] Build & Output settings verified
- [ ] Node.js version set to 20.x

### Code Quality

- [ ] All TODOs resolved or documented
- [ ] TypeScript builds without errors: `npm run build`
- [ ] ESLint passes: `npm run lint`
- [ ] Type checking passes: `npm run type-check`
- [ ] No console.log statements in production code
- [ ] Bundle size optimized (<500 KB first load)
- [ ] Images optimized (WebP format, lazy loading)
- [ ] Unused dependencies removed

### Legal & GDPR

- [ ] Terms & Conditions finalized and published
- [ ] Privacy Policy finalized and published
- [ ] Cookie Policy finalized and published
- [ ] GDPR consent banner implemented
- [ ] Cookie consent stored properly
- [ ] Data retention policy defined
- [ ] User data export functionality (if needed)
- [ ] User data deletion functionality

### Integrations - Production Keys

#### Google AI
- [ ] Production API key created
- [ ] Billing enabled on Google Cloud
- [ ] API rate limits reviewed
- [ ] Safety settings configured

#### Stripe
- [ ] Production mode activated
- [ ] Live API keys obtained
- [ ] Webhook endpoint configured
- [ ] Test payments verified
- [ ] Products & Prices created in live mode
- [ ] Payment methods enabled (Card, Bank transfer)

#### GoPay
- [ ] Production account verified
- [ ] Production credentials obtained
- [ ] Test payment in production gateway
- [ ] Return URLs configured
- [ ] Webhook notifications set up

#### Resend (Email)
- [ ] Production API key obtained
- [ ] Domain verified (claimbuddy.cz)
- [ ] SPF record added to DNS
- [ ] DKIM configured
- [ ] Email templates tested
- [ ] Sending limits reviewed

### Security

- [ ] API rate limiting implemented
- [ ] CORS configuration verified
- [ ] CSP (Content Security Policy) headers set
- [ ] Security headers configured:
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] Referrer-Policy
  - [ ] Permissions-Policy
- [ ] Environment variables secured (not in client bundle)
- [ ] Firebase Admin SDK used server-side only
- [ ] SQL injection prevention (N/A - using Firestore)
- [ ] XSS prevention (React escaping + CSP)
- [ ] CSRF protection for forms

### Monitoring & Error Tracking

- [ ] Sentry error tracking configured
  - [ ] DSN added to environment
  - [ ] Source maps uploaded
  - [ ] Alerts configured
- [ ] Vercel Analytics enabled
- [ ] Firebase Analytics enabled
- [ ] Google Analytics set up (optional)
- [ ] Uptime monitoring (e.g., UptimeRobot)
- [ ] Performance monitoring enabled

### Backup & Recovery

- [ ] Firestore automated backup scheduled
  - [ ] Daily exports to Cloud Storage
  - [ ] Retention policy set (30 days)
- [ ] Storage bucket backup configured
- [ ] Code pushed to GitHub (main branch protected)
- [ ] Environment variables backed up securely
- [ ] Database schema documented
- [ ] Recovery procedures documented

### Performance

- [ ] Core Web Vitals optimized:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] Images optimized with Next.js Image component
- [ ] Fonts preloaded and optimized
- [ ] Code splitting verified
- [ ] Lazy loading implemented for heavy components
- [ ] API response times < 500ms
- [ ] CDN caching configured

### Testing

- [ ] Full user flow tested:
  - [ ] Register new account
  - [ ] Email verification
  - [ ] Login
  - [ ] Create new case
  - [ ] Upload documents
  - [ ] Send messages
  - [ ] Payment flow
  - [ ] Admin panel access
- [ ] Mobile responsiveness verified:
  - [ ] iPhone (Safari)
  - [ ] Android (Chrome)
- [ ] Browser compatibility tested:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
- [ ] PWA functionality (if applicable)
- [ ] Offline behavior tested

### SEO

- [ ] Meta tags configured
- [ ] Open Graph tags added
- [ ] Twitter Cards added
- [ ] Sitemap.xml generated
- [ ] Robots.txt configured
- [ ] Google Search Console verified
- [ ] Structured data (JSON-LD) added
- [ ] 404 page customized

### Customer Support

- [ ] Support email configured (info@claimbuddy.cz)
- [ ] Contact form tested
- [ ] FAQ page finalized
- [ ] Help documentation published
- [ ] Admin notification system tested

---

## Launch Day

- [ ] Final build deployed to production
- [ ] Smoke tests completed
- [ ] Monitoring dashboards open
- [ ] Support team notified
- [ ] Social media announcement prepared

---

## Post-Launch (First 24 Hours)

- [ ] Monitor error rates (Sentry)
- [ ] Check performance metrics (Vercel Analytics)
- [ ] Review Firebase usage
- [ ] Test user registrations
- [ ] Verify payment flows
- [ ] Check email delivery
- [ ] Monitor server costs
- [ ] Respond to user feedback

---

## Post-Launch (First Week)

- [ ] Analyze user behavior (Analytics)
- [ ] Review and fix reported bugs
- [ ] Optimize slow queries
- [ ] Adjust Firestore indexes
- [ ] Review and optimize costs
- [ ] Collect user feedback
- [ ] Plan first iteration

---

## Emergency Contacts & Resources

### Firebase Support
- Console: https://console.firebase.google.com
- Support: https://firebase.google.com/support
- Status: https://status.firebase.google.com

### Vercel Support
- Dashboard: https://vercel.com/dashboard
- Support: https://vercel.com/support
- Status: https://www.vercel-status.com

### Stripe Support
- Dashboard: https://dashboard.stripe.com
- Support: https://support.stripe.com
- Docs: https://stripe.com/docs

### GoPay Support
- Portal: https://app.gopay.cz
- Support: https://help.gopay.com
- Tech docs: https://doc.gopay.com

### Resend Support
- Dashboard: https://resend.com/dashboard
- Support: https://resend.com/support
- Docs: https://resend.com/docs

---

## Rollback Plan

In case of critical issues:

1. **Immediate actions:**
   - Revert to previous Vercel deployment
   - Check error logs in Sentry
   - Notify users via status page

2. **Vercel rollback:**
   ```bash
   vercel rollback [deployment-url]
   ```

3. **Database rollback:**
   - Restore Firestore from backup
   - Contact Firebase support if needed

4. **Communication:**
   - Update status page
   - Send email to active users
   - Post on social media

---

**Last updated:** 2025-11-01
**Owner:** Radim (radim@wikiporadce.cz)
**Status:** Pre-launch checklist
