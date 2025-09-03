This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

Deployment link on vercel : ## 🚀 Live Demo

[Doctor Appointment Management System](https://doctor-appointment-management-syste-mauve.vercel.app)

## Setup instructions and documentation
I approached the Doctor Appointment Management System frontend task by focusing on clarity, responsiveness, and real-world usability. My implementation is built with Next.js (App Router) and TypeScript, styled using Tailwind CSS to ensure a modern and mobile-first design.

🔑 Key Highlights of My Approach:

Authentication Flow

Implemented login & registration for both doctors and patients.

Role-based redirection (Doctor → Appointments page, Patient → Home).

Persistent authentication state via localStorage and Zustand.

Doctor & Patient Features

Patients:

Search & filter doctors by name/specialization.

Paginated doctor list with appointment booking.

Appointment management with status filters (Pending, Completed, Cancelled).

Doctors:

Manage appointments with date & status filters.

Update appointment status (Completed/Cancelled) with optimistic UI updates.

API Integration

All API calls handled via Axios and React Query (TanStack Query).

Used caching, pagination, and optimistic updates for smooth UX.

Clear error/success handling via react-hot-toast.

UI/UX

Consistent, professional design using Tailwind’s utility classes.

Sticky Navbar + smooth scroll for About/Contact sections.

Dark footer with contact info, responsive across devices.

Loading states, empty states, and graceful error handling.

Bonus Enhancements

Reusable components for Navbar, Footer, DoctorCard, and AppointmentCard.

Added transitions and hover effects for interactivity.

Prepared structure for future features like password reset and profile photo upload.

✅ Result

The result is a clean, production-ready frontend that provides a seamless experience for both patients and doctors, closely following the provided task requirements while incorporating best practices from modern frontend development.
