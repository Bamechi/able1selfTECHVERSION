# Able1Self Members-Only Client Portal One-Sheet

## Purpose

Members Only is a separate customer-service app for Shawn and his private clients. It is the shared workspace for measurements, visual direction, working sessions, finalized orders, invoices, and delivery status.

It is not the ABLE self-development program. It must not contain assessment answers, identity profiles, personality results, ABLE modules, the 90-day plan, community, accountability partners, or AI Guide content. Members can return to the main ABLE application for those features.

## Required Navigation

1. Dashboard
2. Measurements
3. Design Board
4. Orders
5. Profile
6. Settings
7. Admin Console for Shawn and Amechi only

## Dashboard

- Welcome using the client's preferred name
- Profile photo
- Occupation
- Birthday
- Member-since date
- Next delivery date
- Next video call, fitting, or design-review session with Shawn
- Active order count and current order status
- Measurement completion percentage
- Design-board count and recent visual references
- Current order progress: planning, design, production, fitting, delivery
- Links to measurements, design boards, orders, and profile

## Measurements

Clients and admins can add or update the current fitting record.

Required fields:

- Neck
- Shoulders
- Chest
- Armhole
- Bicep
- Elbow
- Wrist
- Sleeve
- Jacket length
- Stomach
- Waist
- Hips
- Crotch
- Thigh
- Knee
- Calf
- Ankle
- Outseam
- Inseam
- Short jacket
- Flare length
- Flare width

Measurement metadata:

- Measurement-set label
- Date measured
- Measured by
- Inches/centimeters display control
- Fit notes
- Completion percentage
- Last-updated record

## Design Board

The Design Board is the private visual conversation between Shawn and the client. It should feel like a focused Pinterest/Canva workspace for fashion branding and upcoming looks.

- Multiple named boards
- Image and PDF upload
- Outfit and full-look references
- Garment references
- Fabric and texture references
- Color palettes
- Shoes and accessories
- Uploaded Canva boards or exports
- Caption explaining what the client likes or wants changed
- Design notes for the Shawn review call
- Item type/category
- Decision status: idea, review with Shawn, approved direction, moved to order
- Private access limited to the client, Shawn, and Amechi

## Working Sessions

Sessions are shown on the Dashboard because they support the design process rather than functioning as a separate product area.

- Video-call, fitting, or design-review title
- Date and time
- Video link, location, agenda, or preparation notes
- Status
- Scheduling/request link
- Admin scheduling controls

## Orders

Orders contain only designs that have moved beyond inspiration into an organized, finalized commission.

- Order title
- Order number
- Current status
- Status options: planning, approved, invoiced, in production, fitting, shipped, delivered
- Visual progress tracker
- Invoice amount
- Invoice or tracking link
- Fabric, fit, production, and delivery notes
- Next delivery date
- Active, current, and delivered order counts
- Admin controls to create and update orders
- Client read-only view of Shawn's current status and notes

## Profile

- Full name
- Preferred name
- Email address
- Phone number
- Occupation/professional title
- Birthday
- Shipping address
- Profile photo upload and replacement
- Membership status
- Member-since date
- Next delivery date
- Scheduling link
- Private designer notes visible only to admins

## Settings

- Signed-in account details
- Client-record status
- Return to the main ABLE program
- Sign out
- Password/security controls when account-management support is added

## Admin Console

Admin access is limited to Shawn and Amechi.

- Switch between client accounts
- View the exact client-facing portal
- Edit client profile and delivery details
- Upload/change profile photos
- Add or update measurements
- Add design-board references
- Schedule working sessions
- Create and update orders
- Add invoice/tracking links and notes
- View totals for clients, uploads, sessions, and orders
- View the administrative audit trail

## Required Backend Records

- Member account and access role
- Client profile
- Profile-photo file
- Measurement set and 22 measurement values
- Design-board uploads with board name, item type, caption, and status
- Working-session records
- Order records with production/delivery status
- Admin audit log
- Private file storage

## Open Integrations

- Payment and subscription provider
- Checkout/payment links
- Invoice payment-status sync
- Email/SMS session and delivery notifications
- Calendar/video-call integration
- Optional Canva embed or API connection
- Production backup/export process
- Formal onboarding/invite workflow

## Acceptance Checklist

- Members Only opens as a separate app from the ABLE program.
- No ABLE assessment, identity profile, module, plan, community, or accountability content appears inside it.
- Client can upload/change a profile photo.
- Client can add/update all 22 measurements.
- Client can create named visual boards and upload references.
- Shawn and Amechi can review the same boards and schedule sessions.
- Finalized designs can become orders with invoice and status information.
- Shawn and Amechi can switch clients and update order status.
- Data persists after refresh.
- Text is readable on desktop and mobile without tiny labels or horizontal overflow.
