# Communication & Announcement Management System — Dashboard + Mobile App

## Role

Act as a **Senior Full-Stack Engineer, Solution Architect, UI/UX Engineer, and Product Engineer**.

You are responsible for designing and implementing a complete, production-ready **Communication & Announcement Management System** for an existing admin dashboard and mobile application.

Do not create a superficial demo. First inspect the existing project architecture, authentication system, database structure, user/role models, API structure, notification infrastructure, and UI conventions. The implementation must integrate cleanly with the existing system.

Follow the existing architecture and coding conventions wherever possible. Do not unnecessarily rewrite existing modules.

---

# 1. FEATURE OBJECTIVE

Build a centralized **Communication Management** feature that allows dashboard administrators to communicate with application users through multiple channels.

Administrators should be able to:

* Send push notifications
* Send in-app notifications
* Send emails
* Send SMS
* Send through multiple channels simultaneously
* Send to all users
* Send to specific users
* Send to users based on role
* Send to selected groups/audiences
* Schedule communications
* Send immediately
* Create application announcements
* Display announcements as banners inside the mobile application
* Attach images to announcements
* Target announcements to specific roles
* Track communication delivery and engagement
* View communication history
* View communication analytics
* Manage drafts
* Preview communications before sending

The system should be designed to support future communication channels without requiring major architectural changes.

---

# 2. COMMUNICATION CHANNELS

Create a flexible communication channel architecture supporting:

### Push Notification

Send notifications to users' registered devices.

Examples:

* Firebase Cloud Messaging
* APNs where applicable

### Email

Allow administrators to send emails to selected users.

Include:

* Email subject
* Email body
* HTML/rich-text content if supported
* Optional attachments/images
* Recipient selection

### SMS

Allow administrators to send SMS messages.

The architecture should abstract the SMS provider so the provider can be changed later.

### In-App Notification

Create notifications that appear inside the mobile application.

Examples:

* Notification center
* Notification badge
* Notification list
* Read/unread state

### Multi-Channel Communication

Administrators should be able to select:

* Push only
* Email only
* SMS only
* In-app only
* Push + Email
* Push + SMS
* Email + SMS
* Push + Email + SMS + In-App
* Any combination

Design this using a scalable channel configuration rather than hardcoding combinations.

---

# 3. AUDIENCE / RECIPIENT TARGETING

The administrator must be able to determine exactly who receives a communication.

Provide the following targeting options:

### All Users

Send to every active user.

### Specific Users

Allow admins to search and select individual users.

Search by:

* Name
* Email
* Phone number
* User ID
* Account ID

Allow multiple users to be selected.

### User Role

Allow targeting by role.

Example roles:

* Rider
* Customer
* Vendor
* Driver
* Admin
* Staff
* Partner

Do not hardcode these roles if the existing application already has a role/permission system. Use the existing role model.

### Multiple Roles

Allow administrators to select multiple roles.

Example:

`Rider + Customer`

### Custom Audience

If the application already contains user segmentation, allow targeting based on available attributes such as:

* Account status
* Location
* Subscription
* Membership
* Vendor status
* Rider status
* Active/inactive users
* Other existing user attributes

Design the architecture so additional segmentation rules can be added later.

---

# 4. COMMUNICATION COMPOSER

Create a professional communication composer inside the admin dashboard.

Suggested workflow:

## Step 1 — Select Communication Type

Options:

* Notification
* Announcement
* Promotional Communication
* System Update
* Maintenance Notice
* General Information

The system should allow additional communication types in the future.

---

## Step 2 — Select Channels

Provide selectable channel cards or checkboxes:

☐ Push Notification
☐ Email
☐ SMS
☐ In-App Notification

Allow multiple channels.

The UI should dynamically display the fields required for the selected channels.

---

# 5. MESSAGE CONTENT

Provide a rich communication composer.

Common fields:

### Title

Example:

> Scheduled Maintenance Notice

### Short Message

Example:

> Our services will undergo scheduled maintenance tonight.

### Full Description

Allow a longer message for email and in-app announcements.

### Image

Allow administrators to upload an image.

Support:

* JPG
* JPEG
* PNG
* WebP

Include:

* Image preview
* Replace image
* Remove image
* Upload progress
* File validation

Store uploaded images using the application's existing storage infrastructure.

Do not create a separate storage system if one already exists.

---

# 6. PUSH NOTIFICATION CONTENT

For push notifications support:

* Notification title
* Notification body
* Image
* Optional deep link
* Optional action button
* Optional notification category
* Optional metadata

Example:

Title:

> New Ride Request

Body:

> You have a new ride request waiting for you.

Action:

`OPEN_RIDE`

The notification payload should support navigation to a specific screen in the mobile application.

---

# 7. EMAIL CONTENT

For email communications support:

* Subject
* Preview text
* Email body
* Rich text/HTML
* Image
* Call-to-action button
* Optional attachments

Allow administrators to preview the email before sending.

---

# 8. SMS CONTENT

SMS should provide:

* Message body
* Character counter
* Estimated SMS segments
* Recipient count
* Estimated cost if the SMS provider exposes pricing

Warn the administrator if the message exceeds the recommended SMS length.

---

# 9. IN-APP ANNOUNCEMENTS

Create a dedicated **App Communications / Announcements** feature.

This is different from ordinary notifications.

Administrators should be able to publish an announcement that appears prominently inside the mobile application.

Example:

> 🚨 Important Service Update

> Our payment system will undergo maintenance from 11:00 PM to 1:00 AM.

The mobile application should display announcements using a banner/card component.

---

# 10. MOBILE APP ANNOUNCEMENT BANNER

Create a reusable announcement banner component.

The banner should support:

* Image
* Title
* Short description
* CTA button
* Close/dismiss button
* Announcement priority
* Start date
* End date

Example:

---

[ ANNOUNCEMENT IMAGE ]

### Scheduled Maintenance

Our payment services will be temporarily unavailable tonight.

[ Learn More ]              [ × ]

---

The banner should be visually polished and responsive.

---

# 11. ANNOUNCEMENT BEHAVIOUR

Administrators should control:

### Display Mode

* Banner
* Modal
* Notification Center
* Banner + Notification

### Priority

* Normal
* Important
* Critical

### Visibility

* Start immediately
* Schedule start date/time
* Expiration date/time

### Dismissibility

Allow:

* Dismissible
* Non-dismissible

If dismissible, track when the user dismissed the announcement.

---

# 12. ROLE TARGETING FOR ANNOUNCEMENTS

Announcements must support audience targeting.

Example:

### Audience

☐ All Users
☐ Riders
☐ Customers
☐ Vendors

Administrators should also be able to select specific users.

Example:

> This announcement is only visible to Riders.

The backend must enforce the targeting rules rather than relying only on mobile-side filtering.

---

# 13. COMMUNICATION SCHEDULING

Allow administrators to choose:

### Send Now

Immediately process the communication.

### Schedule

Select:

* Date
* Time
* Time zone

Example:

> August 15, 2026 — 8:00 AM

The system should queue the communication and process it at the scheduled time.

---

# 14. DRAFTS

Administrators should be able to save communications as drafts.

Drafts should store:

* Communication type
* Channels
* Audience
* Message content
* Images
* Scheduling information
* Created by
* Created date
* Last modified date

Actions:

* Continue editing
* Duplicate
* Delete
* Preview
* Schedule
* Send

---

# 15. PREVIEW

Before sending, provide a communication preview.

Show how the message will appear on:

### Mobile Push

Example:

> **Scheduled Maintenance**
> Our services will undergo maintenance tonight.

### In-App

Display the actual banner/card design.

### Email

Display an email-style preview.

### SMS

Display SMS content with character count.

The administrator should be able to switch between previews.

---

# 16. CONFIRMATION BEFORE SENDING

Before sending a communication, display a confirmation screen.

Example:

### Review Communication

**Channels**

Push + Email + In-App

**Audience**

Riders

**Recipients**

2,481 users

**Scheduled**

Immediately

**Title**

Scheduled Maintenance

Then:

`Cancel`

`Send Communication`

For large audiences, require an additional confirmation to prevent accidental mass communication.

---

# 17. COMMUNICATION HISTORY

Create a communication history page.

Display:

| Communication      | Type         | Channels     | Audience  | Recipients | Status    | Date   |
| ------------------ | ------------ | ------------ | --------- | ---------: | --------- | ------ |
| Maintenance Notice | Announcement | Push + Email | Riders    |      2,481 | Sent      | Aug 9  |
| New Feature        | Update       | In-App       | All Users |      8,920 | Scheduled | Aug 10 |

Statuses:

* Draft
* Scheduled
* Processing
* Sent
* Partially Sent
* Failed
* Cancelled

Allow filtering by:

* Date
* Channel
* Status
* Role
* Communication type
* Administrator

---

# 18. COMMUNICATION DETAILS / ANALYTICS

Clicking a communication should open a detailed analytics page.

Track where supported:

### Push

* Sent
* Delivered
* Failed
* Opened

### Email

* Sent
* Delivered
* Bounced
* Opened
* Clicked

### SMS

* Sent
* Delivered
* Failed

### In-App

* Displayed
* Viewed
* Clicked
* Dismissed

Display summary cards:

**Recipients**

8,920

**Delivered**

8,610

**Opened**

5,821

**Clicked**

2,401

**Failed**

310

Use charts where appropriate.

---

# 19. NOTIFICATION TEMPLATES

Create reusable communication templates.

Administrators should be able to create templates such as:

* Welcome Message
* Payment Reminder
* Account Update
* Maintenance Notice
* Promotional Message
* Service Interruption
* New Feature Announcement

Template fields:

* Template name
* Communication type
* Default channels
* Title
* Message
* Image
* CTA
* Target audience

Allow admins to:

* Create
* Edit
* Duplicate
* Archive
* Use template

---

# 20. VARIABLES / PERSONALIZATION

Support dynamic variables where possible.

Examples:

`{{first_name}}`

`{{last_name}}`

`{{account_id}}`

`{{ride_id}}`

`{{invoice_id}}`

`{{amount}}`

Example:

> Hello {{first_name}}, your invoice {{invoice_id}} of {{amount}} is now available.

The backend should resolve variables safely for each recipient.

Do not allow arbitrary unsafe template execution.

---

# 21. DEEP LINKS

Allow communications to contain optional application navigation actions.

Examples:

Notification:

> Your invoice is ready.

Action:

`View Invoice`

Deep link:

`/invoices/12345`

Other examples:

* `/rides`
* `/payments`
* `/profile`
* `/subscriptions`
* `/vehicles`
* `/stations`

Integrate with the existing mobile navigation/router.

---

# 22. DATABASE DESIGN

Design appropriate database entities.

Suggested models:

### communications

Fields may include:

* id
* title
* description
* communication_type
* status
* created_by
* scheduled_at
* sent_at
* expires_at
* created_at
* updated_at

### communication_channels

* id
* communication_id
* channel
* status
* processed_at
* failure_reason

### communication_audiences

* id
* communication_id
* audience_type
* role_id
* user_id
* filter_definition

### communication_recipients

* id
* communication_id
* user_id
* channel
* status
* delivered_at
* opened_at
* clicked_at
* dismissed_at
* failure_reason

### announcement_settings

* communication_id
* display_type
* priority
* dismissible
* start_at
* expires_at

### communication_templates

* id
* name
* type
* content
* created_by
* created_at
* updated_at

Adapt these models to the existing database architecture instead of blindly creating duplicate user/role systems.

---

# 23. BACKEND ARCHITECTURE

Use a service-oriented communication architecture.

Example:

CommunicationService

→ AudienceService

→ ChannelDispatcher

→ PushNotificationService

→ EmailService

→ SmsService

→ InAppNotificationService

→ AnnouncementService

This should allow additional channels to be added later.

For example:

WhatsApp
Telegram
Webhook
etc.

without rewriting the entire communication module.

---

# 24. ASYNCHRONOUS PROCESSING

Do not process large mass communications synchronously inside an HTTP request.

For large audiences:

1. Create communication
2. Resolve audience
3. Create/queue communication jobs
4. Process jobs asynchronously
5. Dispatch through selected channels
6. Track delivery results
7. Update communication status

Implement batching and retry handling where supported by the existing infrastructure.

Prevent duplicate sends using idempotency controls.

---

# 25. FAILURE HANDLING

Handle failures gracefully.

Examples:

* Invalid email
* Missing phone number
* Invalid push token
* Expired device token
* SMS provider failure
* Email provider failure
* Network failure
* Storage upload failure

Store meaningful failure reasons.

Implement retry logic where appropriate.

Do not endlessly retry permanent failures.

---

# 26. SECURITY & PERMISSIONS

Only authorized dashboard administrators should access communication management.

Create permissions such as:

* communication.view
* communication.create
* communication.edit
* communication.send
* communication.schedule
* communication.delete
* communication.templates
* communication.analytics

Mass communication sending should require appropriate permission.

Log important administrative actions.

Example:

> Admin John created communication "Scheduled Maintenance".

> Admin John sent communication to 2,481 Riders.

---

# 27. AUDIT LOGGING

Every important action should be logged.

Track:

* Created
* Edited
* Scheduled
* Sent
* Cancelled
* Deleted
* Template created
* Template modified

Include:

* Admin/user
* Action
* Communication ID
* Timestamp
* Relevant metadata

Use the existing audit logging system if one already exists.

---

# 28. ADMIN DASHBOARD UI

Create a professional dashboard interface.

Main navigation:

### Communications

Sub-navigation:

* Overview
* Create Communication
* Announcements
* Templates
* Scheduled
* History
* Analytics

---

# 29. COMMUNICATION DASHBOARD

Display summary cards:

**Total Communications**

**Sent Today**

**Scheduled**

**Failed**

**Total Recipients**

**Engagement Rate**

Include charts such as:

* Communications over time
* Channel usage
* Delivery rate
* Open rate
* Click rate
* Audience distribution

---

# 30. MOBILE APPLICATION INTEGRATION

Implement the mobile-side communication infrastructure.

The mobile application should:

* Register for push notifications
* Store/update device tokens
* Receive push notifications
* Handle notification taps
* Navigate through deep links
* Retrieve active announcements
* Display announcement banners
* Mark announcements as viewed
* Track dismissals
* Track CTA clicks
* Display in-app notifications
* Maintain unread notification count

Use the mobile application's existing notification and navigation architecture where possible.

---

# 31. API ENDPOINTS

Design RESTful endpoints or follow the application's existing API conventions.

Examples:

### Communications

POST `/communications`

GET `/communications`

GET `/communications/{id}`

PUT `/communications/{id}`

DELETE `/communications/{id}`

POST `/communications/{id}/send`

POST `/communications/{id}/schedule`

POST `/communications/{id}/cancel`

### Templates

GET `/communication-templates`

POST `/communication-templates`

PUT `/communication-templates/{id}`

DELETE `/communication-templates/{id}`

### Announcements

GET `/announcements/active`

POST `/announcements`

PUT `/announcements/{id}`

POST `/announcements/{id}/publish`

### Mobile

POST `/users/device-token`

DELETE `/users/device-token`

POST `/communications/{id}/view`

POST `/communications/{id}/click`

POST `/communications/{id}/dismiss`

Adapt endpoint naming to the existing backend conventions.

---

# 32. IMPORTANT UX REQUIREMENTS

The communication composer must be simple enough for a non-technical administrator to use.

Use progressive disclosure.

Do not display every advanced setting immediately.

Recommended flow:

**Audience → Channels → Content → Scheduling → Preview → Confirm → Send**

Show a progress indicator.

Example:

`1 Audience → 2 Channels → 3 Content → 4 Schedule → 5 Review`

---

# 33. VALIDATION

Implement strong frontend and backend validation.

Examples:

* Title required
* Message required
* At least one channel required
* At least one recipient/audience required
* Scheduled date cannot be in the past
* Email subject required when Email is selected
* SMS message required when SMS is selected
* Push title/body required for Push
* Image file type validation
* Image size validation
* CTA URL/deep-link validation

Never rely solely on frontend validation.

---

# 34. RESPONSIVENESS

The admin dashboard should work properly on:

* Desktop
* Laptop
* Tablet

The mobile communication experience should work across supported mobile screen sizes.

Follow the existing dashboard design system, spacing, typography, colors, components, and responsive breakpoints.

---

# 35. PERFORMANCE

Optimize for large user populations.

The system should be capable of handling large audiences without blocking the dashboard.

Avoid:

* Loading thousands of users into the browser
* Sending thousands of notifications directly from the frontend
* Long synchronous API requests
* Duplicate notification delivery

Use:

* Pagination
* Server-side search
* Batch processing
* Queues/jobs
* Caching where appropriate
* Database indexes

---

# 36. EXTENSIBILITY

The architecture must make it easy to add future communication channels.

For example:

```text
CommunicationChannel
 ├── Push
 ├── Email
 ├── SMS
 ├── InApp
 ├── WhatsApp
 └── Webhook
```

Do not tightly couple the communication composer to individual providers.

Use interfaces/abstractions where appropriate.

---

# 37. IMPLEMENTATION PROCESS

Before writing code:

### Phase 1 — Inspect

Analyze:

* Existing project structure
* Authentication
* User model
* Role model
* Database
* API architecture
* Existing notification system
* Firebase configuration
* Email/SMS infrastructure
* Mobile navigation
* Existing dashboard UI components
* Existing file/image upload infrastructure

### Phase 2 — Architecture

Provide:

1. Architecture proposal
2. Database schema changes
3. API design
4. Service structure
5. Frontend component structure
6. Mobile integration plan
7. Security/permission model
8. Background processing strategy

### Phase 3 — Implementation

Implement the feature incrementally.

Start with:

1. Database/models
2. Backend communication service
3. Audience targeting
4. Channel dispatcher
5. Push notifications
6. Email
7. SMS
8. In-app notifications
9. Announcements
10. Dashboard UI
11. Mobile UI
12. Scheduling
13. Templates
14. Analytics
15. Audit logging

### Phase 4 — Testing

Create tests for:

* Audience targeting
* Role targeting
* Specific users
* All users
* Multiple channels
* Scheduling
* Push delivery
* Email delivery
* SMS delivery
* Announcement visibility
* Role restrictions
* Permission checks
* Duplicate prevention
* Failed delivery
* Retry logic
* Deep links
* Mobile announcement dismissal
* Analytics tracking

---

# 38. IMPORTANT DEVELOPMENT RULES

1. **Do not break existing functionality.**

2. **Do not create duplicate authentication, user, role, or storage systems.**

3. Reuse existing infrastructure whenever possible.

4. Follow the project's current architecture and coding conventions.

5. Do not hardcode roles if roles already exist in the backend.

6. Do not hardcode communication providers.

7. Keep provider credentials in secure environment variables.

8. Never expose provider API keys in the frontend.

9. Perform authorization checks on the backend.

10. Do not allow unauthorized administrators to send mass communications.

11. Use transactions where appropriate.

12. Use queues/background workers for mass communication.

13. Implement idempotency to prevent duplicate sends.

14. Use pagination for large datasets.

15. Make all communication actions auditable.

16. Ensure all user-facing communication content is sanitized.

17. Handle provider failures gracefully.

18. Build reusable components instead of duplicating UI.

19. Maintain backward compatibility with existing APIs.

20. Do not make unnecessary architectural changes.

---

# 39. EXPECTED FINAL DELIVERABLE

At the end of the implementation, provide:

### Backend

* Database migrations
* Models
* Controllers
* Services
* Channel adapters
* Queue/jobs
* API endpoints
* Validation
* Authorization
* Audit logs
* Tests

### Admin Dashboard

* Communication dashboard
* Communication composer
* Audience selector
* Channel selector
* Content editor
* Image uploader
* Announcement manager
* Template manager
* Scheduling
* Preview
* Communication history
* Analytics
* Permission management integration

### Mobile App

* Push notification handling
* Device token registration
* In-app notification center
* Announcement banner
* Announcement details
* Deep-link handling
* View/click/dismiss tracking

### Documentation

Provide documentation covering:

* Architecture
* Database schema
* API endpoints
* Environment variables
* Notification provider configuration
* Email configuration
* SMS configuration
* Queue configuration
* Mobile notification setup
* Deployment requirements
* Testing instructions

---

# 40. ACCEPTANCE CRITERIA

The feature is considered complete only when an authorized administrator can:

1. Open Communications from the dashboard.
2. Create a new communication.
3. Select All Users, specific users, or roles.
4. Select Rider, Customer, Vendor, or other existing roles.
5. Select one or multiple communication channels.
6. Write the communication.
7. Upload an image.
8. Preview the communication.
9. Send immediately.
10. Schedule it for later.
11. Save it as a draft.
12. Create and reuse templates.
13. Publish an application announcement.
14. Display that announcement as a mobile banner.
15. Control announcement visibility by role.
16. Set announcement start and expiration dates.
17. Track delivery and engagement.
18. View communication history.
19. Retry failed communications where appropriate.
20. View analytics.
21. See all actions reflected in audit logs.

The final implementation should feel like a **professional enterprise-grade Communication Center**, not a basic notification form.

Before making major architectural decisions, inspect the existing codebase and explain what already exists, what can be reused, what needs modification, and what needs to be newly created.
