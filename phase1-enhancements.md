# Phase 1 Enhancements

## Upload Page ([/upload](https://thegoldenframe.co/upload))

- Redesign the upload page for a more modern, user-friendly layout
- Add **First Name**, **Last Name**, and **Email** fields to the upload form
- Apply basic field validation on all form fields
- Replace "Create your AR frame" with **"Create your AR experience"**
- Replace "delivered in 2-3 days" with **"dispatched in 2-3 business days"**

### Frame & Video Upload Buttons
- Improve button design to be more visually appealing and encourage uploads
- Add a **progress bar** for both photo and video uploads

### Upload Limits
- Cap video uploads at **1 minute** and **500 MB**
- Display clear guidelines on the page before the user attempts an upload

### Post-Upload Feedback
- Show a clear **confirmation message** after a successful upload

---

## Checkout & Payment

- Add a **coupon code field** on the Stripe checkout page
- Generate a **master test coupon code** that bypasses payment (for dev/QA use)

---

## Order Success Page

- Redesign the success page with a cleaner, more polished layout
- Show order details and clear next steps prominently

---

## Branding & Design

- **Logo:** insert placeholder now; swap in final asset when ready (place in `/public` or designated folder)
- **Fonts:** switch to a modern typeface (e.g. Inter, Open Sans, or Lato)
- **Color scheme:** incorporate golden variations — light, medium, and dark gold — to align with brand identity

---

## AR Experience Performance

**Current state:** QR scan → AR load takes ~10 seconds.  
**Target:** reduce to ≤ 3 seconds.

### Optimisation approaches to explore
- Compress and optimise AR assets (models, textures)
- Implement asset caching / CDN delivery
- Lazy-load non-critical resources
- Pre-warm assets in the background after QR scan
- Use WebP/AVIF for image assets; Draco compression for 3D models

### UX while loading
- Add a branded loading screen with a progress indicator
- Show a friendly message (e.g. "Getting your AR experience ready…")
- Avoid a blank or frozen screen during the wait

---

## General Site UX

- Audit navigation for clarity and ease of use
- Ensure consistent, high-quality imagery across all pages
- Conduct lightweight user testing to identify friction points
