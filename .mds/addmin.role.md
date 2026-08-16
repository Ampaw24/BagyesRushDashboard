# Vendor Management & Role Administration System

## Enterprise-Grade Admin Dashboard Feature Specification

### ROLE

Act as a **Senior Software Architect, Full-Stack Engineer, Backend Engineer, Database Architect, Security Engineer, and UI/UX Engineer**.

Your task is to design and implement a complete, production-ready **Vendor Management System** and **Administrative Role & Access Management System** for the existing platform.

The platform supports food vendors, customers, riders, and administrators.

The new functionality must allow authorized administrators to:

* Manage food vendors
* Create, view, edit, suspend, activate, and delete vendors
* Manage vendor accounts and profiles
* Review vendor status
* Manage vendor operational information
* Search and filter vendors
* View vendor activity
* Manage vendor onboarding
* Manage administrator accounts
* Promote eligible customer accounts to admin
* Change user roles
* Remove administrator privileges
* Add new administrators
* Deactivate administrators
* Enforce Super Admin permissions
* Maintain complete audit trails for sensitive actions

The implementation must integrate with the existing authentication, users, roles, permissions, database, API, dashboard UI, and mobile application.

**Do not build a separate authentication or role system if one already exists.**

First inspect the existing codebase and identify what can be reused.

---

# 1. HIGH-LEVEL MODULE STRUCTURE

Create two major dashboard modules:

## A. Vendor Management

```text
Admin Dashboard
   └── Vendors
       ├── Overview
       ├── All Vendors
       ├── Pending Vendors
       ├── Active Vendors
       ├── Suspended Vendors
       ├── Inactive Vendors
       ├── Vendor Applications
       └── Vendor Details
```

## B. Administration & Access Management

```text
Admin Dashboard
   └── Administration
       ├── Admin Users
       ├── Customers
       ├── Roles
       ├── Permissions
       ├── Role Changes
       └── Audit Logs
```

Only users with the appropriate permissions should see these modules.

---

# 2. VENDOR MANAGEMENT OBJECTIVE

Create a centralized system where administrators can manage all food vendors operating on the platform.

A vendor should have a complete profile containing information such as:

### Business Information

* Vendor ID
* Business name
* Business registration name
* Business description
* Business category
* Business logo
* Cover image
* Business phone number
* Business email
* Website/social links where applicable

### Owner Information

* Owner name
* Owner user ID
* Email
* Phone number
* Verification status

### Location

* Address
* City
* Region
* GPS latitude
* GPS longitude
* Delivery/service area

### Operational Information

* Opening hours
* Closing hours
* Operating days
* Minimum order amount
* Delivery availability
* Pickup availability
* Estimated preparation time

### Platform Information

* Vendor status
* Verification status
* Approval status
* Date joined
* Last active date
* Created by
* Updated by

Do not duplicate information already stored in the existing user/customer model. Reference existing entities where appropriate.

---

# 3. VENDOR CRUD

Implement complete CRUD functionality.

## CREATE

Authorized administrators should be able to create a vendor.

Required information should be validated.

Possible workflow:

```text
Create Vendor
      ↓
Business Information
      ↓
Owner Information
      ↓
Location
      ↓
Operating Information
      ↓
Review
      ↓
Create Vendor
```

If vendors are represented by user accounts, create/link the vendor to the appropriate existing user account rather than creating duplicate users.

---

# 4. VIEW VENDOR

Create a detailed Vendor Profile page.

Example layout:

```text
------------------------------------------------
Vendor Profile

[Logo]

Business Name
Vendor ID
Status: Active
Verification: Verified

Owner
John Doe

Phone
+233 XXX XXX XXX

Email
vendor@email.com

Location
Accra, Ghana

Operating Hours
Mon - Sun
10:00 AM - 10:00 PM

------------------------------------------------

Overview
Orders
Products/Menu
Transactions
Reviews
Customers
Activity
Settings
------------------------------------------------
```

Use tabs where appropriate.

---

# 5. EDIT VENDOR

Authorized users should be able to update:

* Business name
* Description
* Contact information
* Address
* Location
* Operating hours
* Delivery settings
* Vendor status
* Business images
* Other permitted vendor attributes

Every modification should be logged.

Show:

```text
Last updated by:
Admin Name

Last updated:
Date / Time
```

---

# 6. DELETE VENDOR

Do not immediately hard-delete vendors unless the existing business architecture explicitly requires it.

Prefer a soft-delete/archive approach.

Possible statuses:

* Active
* Pending
* Suspended
* Inactive
* Archived

When deleting a vendor:

### Confirmation

> Are you sure you want to archive this vendor?

Explain that archived vendors will no longer be available to customers but their historical orders, payments, and records will remain accessible.

Require appropriate permission.

For sensitive/high-impact actions, require confirmation or elevated authorization.

---

# 7. VENDOR SUSPENSION

Create a dedicated suspension workflow.

An authorized administrator should be able to suspend a vendor.

When suspending:

Require:

* Suspension reason
* Optional internal note
* Effective date
* Optional end date

Example reasons:

* Policy violation
* Business temporarily closed
* Payment issue
* Customer complaints
* Verification issue
* Administrative action
* Other

When suspended:

* Vendor should not accept new orders
* Vendor should not appear as available to customers
* Existing historical records must remain intact
* Vendor owner should receive appropriate notification if the communication system exists

---

# 8. VENDOR ACTIVATION

Administrators should be able to reactivate suspended/inactive vendors where permitted.

Before activation:

* Verify vendor status
* Check required information
* Record activating administrator
* Create audit log

---

# 9. VENDOR VERIFICATION

Create a vendor verification system if the existing platform does not already have one.

Statuses:

```text
Pending
Verified
Rejected
Requires Review
```

Administrators should be able to:

* Verify vendor
* Reject vendor
* Request additional information

For rejection or request-for-information actions, require an explanation.

---

# 10. VENDOR APPLICATION / ONBOARDING

If vendors can register themselves, create an administrative approval workflow.

Example:

```text
Vendor Registers
       ↓
Pending
       ↓
Admin Review
       ↓
Approved → Active
       ↓
Rejected
```

Admin should be able to review:

* Business information
* Owner information
* Submitted documents
* Contact information
* Location
* Supporting information

Do not approve a vendor automatically unless the existing business rules require it.

---

# 11. VENDOR LIST PAGE

Create a professional vendor table.

Columns:

| Vendor | Owner | Category | Location | Status | Verification | Joined | Actions |
| ------ | ----- | -------- | -------- | ------ | ------------ | ------ | ------- |

Actions:

* View
* Edit
* Verify
* Suspend
* Activate
* Archive
* More

Provide:

### Search

Search by:

* Vendor name
* Vendor ID
* Owner name
* Email
* Phone

### Filters

* Status
* Verification
* Location
* Category
* Date joined

### Sorting

* Name
* Date created
* Status
* Last activity

Use server-side pagination and filtering for large datasets.

---

# 12. VENDOR DASHBOARD OVERVIEW

Create vendor management analytics.

Cards:

**Total Vendors**

**Active Vendors**

**Pending Vendors**

**Suspended Vendors**

**New Vendors**

**Verified Vendors**

Charts:

* Vendor registrations over time
* Active vs inactive vendors
* Vendor distribution by location
* Vendor categories
* Vendor status distribution

Use the existing dashboard charting system if available.

---

# 13. VENDOR MENU / PRODUCTS

If the existing platform has food/menu management, integrate it into the Vendor Details page.

Example:

```text
Vendor
 ├── Overview
 ├── Menu
 ├── Orders
 ├── Transactions
 ├── Reviews
 ├── Customers
 └── Activity
```

Do not implement a separate menu system if one already exists.

The vendor management feature should act as the central administrative entry point to the vendor's information.

---

# 14. ADMINISTRATION MANAGEMENT

Create a separate **Administration / User Management** module.

The objective is to allow authorized administrators to manage platform users and administrative access.

The system must distinguish clearly between:

* Customer
* Rider
* Vendor
* Admin
* Super Admin

Use the existing role system where available.

---

# 15. ROLE HIERARCHY

Implement a secure role hierarchy.

Example:

```text
Super Admin
     ↓
Admin
     ↓
Customer / Rider / Vendor
```

The exact hierarchy must respect the existing authorization model.

### Super Admin

Super Admin should have elevated privileges.

Potential permissions:

* Create admins
* Remove admins
* Promote eligible users to admin
* Demote admins where allowed
* Change user roles
* Assign permissions
* Revoke permissions
* Manage administrators
* Manage vendors
* Access audit logs
* Configure platform settings

### Admin

Admins should only have permissions explicitly granted to them.

An Admin should NOT automatically be able to:

* Create Super Admins
* Remove Super Admins
* Change Super Admin roles
* Grant themselves elevated privileges
* Grant permissions they do not possess

---

# 16. SUPER ADMIN PROTECTION

This is a critical security requirement.

Super Admin functionality must be enforced at the **backend authorization layer**.

Do not rely on:

```text
if user.role == "super_admin"
```

only in the frontend.

Every sensitive API request must validate the authenticated user's permissions server-side.

Example:

```text
Request
   ↓
Authentication
   ↓
Authorization
   ↓
Permission Check
   ↓
Resource Validation
   ↓
Action
```

Never trust role information supplied by the client.

---

# 17. ADMIN USER MANAGEMENT

Create an Admin Management page.

Example:

| Administrator | Email | Role | Status | Last Login | Created | Actions |
| ------------- | ----- | ---- | ------ | ---------- | ------- | ------- |

Actions:

* View
* Edit
* Change Role
* Suspend
* Activate
* Remove Admin Access
* Manage Permissions

Sensitive actions should only be available to authorized users.

---

# 18. PROMOTE CUSTOMER TO ADMIN

A Super Admin should be able to promote an eligible customer account to Admin.

Example workflow:

```text
Customers
   ↓
Select Customer
   ↓
View Customer Profile
   ↓
Change Role
   ↓
Select Admin
   ↓
Review Permissions
   ↓
Confirm
   ↓
Admin Account Created
```

Do not create a duplicate user.

Modify the existing user's role or role assignment.

Before promotion display:

```text
You are about to promote:

John Doe
john@email.com

Current Role:
Customer

New Role:
Admin

Permissions:
[permission list]

This action will grant administrative access.
```

Require confirmation.

---

# 19. ROLE CHANGE

Authorized Super Admins should be able to change user roles.

Example:

```text
Customer → Admin
Rider → Customer
Vendor → Customer
Admin → Customer
```

However, enforce business rules.

For example:

* Cannot promote a user to Super Admin unless explicitly authorized.
* Cannot modify the last remaining Super Admin.
* Cannot remove your own Super Admin privileges unless a dedicated recovery mechanism exists.
* Cannot bypass permission restrictions.
* Cannot assign permissions above your own authorization level.

---

# 20. REMOVE ADMIN ACCESS

Super Admin should be able to remove admin privileges from an administrator.

Workflow:

```text
Admin Profile
     ↓
Remove Admin Access
     ↓
Select Reason
     ↓
Confirmation
     ↓
Role changed
     ↓
Session/token invalidation
     ↓
Audit Log
```

Important:

If an administrator is currently logged in, invalidate/revoke their active sessions or tokens where the authentication architecture supports it.

The user should immediately lose administrative access.

---

# 21. ADMIN SUSPENSION

Allow authorized Super Admins to temporarily suspend an administrator.

Require:

* Reason
* Optional note
* Duration or expiration
* Effective date

Suspended administrators should not be able to access protected dashboard functions.

---

# 22. ROLE & PERMISSION MANAGEMENT

Do not make roles equal to permissions.

Use a permission-based authorization model.

Example:

```text
Role
  ↓
Permissions
```

Permissions may include:

```text
vendor.view
vendor.create
vendor.edit
vendor.suspend
vendor.delete

user.view
user.edit
user.role.change

admin.view
admin.create
admin.edit
admin.remove

communication.view
communication.create
communication.send

analytics.view
audit.view
```

This allows flexible role configuration.

---

# 23. ROLE ASSIGNMENT UI

Create a professional role assignment interface.

Example:

```text
User
John Doe

Current Role
Customer

Change Role

○ Customer
○ Rider
○ Vendor
● Admin

Permissions

☑ Dashboard Access
☑ User Management
☑ Vendor Management
☑ Communication Management
☐ Role Management
☐ Admin Management
☐ System Settings
```

The UI must only show permissions that the current administrator is allowed to grant.

---

# 24. PREVENT PRIVILEGE ESCALATION

Implement strict privilege escalation protection.

An Admin should not be able to:

```text
Admin → Super Admin
```

unless explicitly authorized by the security model.

A user cannot grant another user permissions that exceed the granting user's own maximum permissions.

Example:

```text
Super Admin
    ↓
Can grant Admin permissions

Admin
    ↓
Can grant only permissions they possess
```

---

# 25. LAST SUPER ADMIN PROTECTION

Never allow the system to accidentally remove all Super Admin accounts.

Before removing/demoting a Super Admin:

```text
Current Super Admin Count = 1

Action blocked.

At least one active Super Admin must remain.
```

This rule must be enforced on the backend.

---

# 26. SESSION SECURITY

When changing a user's administrative role:

* Revoke existing authentication sessions where appropriate
* Refresh permissions
* Invalidate cached authorization data
* Require re-authentication if appropriate

Example:

```text
Customer promoted to Admin
        ↓
Role updated
        ↓
Authorization cache invalidated
        ↓
New permissions applied
```

When Admin privileges are removed:

```text
Admin → Customer
        ↓
Existing admin sessions revoked
        ↓
Dashboard access removed
```

---

# 27. AUDIT LOGGING

Every sensitive action must generate an audit event.

Examples:

```text
ADMIN_CREATED
ADMIN_ROLE_CHANGED
ADMIN_SUSPENDED
ADMIN_REACTIVATED
ADMIN_REMOVED

USER_ROLE_CHANGED

VENDOR_CREATED
VENDOR_UPDATED
VENDOR_SUSPENDED
VENDOR_ACTIVATED
VENDOR_ARCHIVED
VENDOR_VERIFIED
VENDOR_REJECTED
```

Audit record should contain:

* ID
* Action
* Actor
* Target user/resource
* Previous value
* New value
* Reason
* IP address where available
* User agent where available
* Timestamp
* Metadata

For role changes, store both:

```text
Previous Role
New Role
```

Never store passwords or sensitive authentication secrets in audit logs.

---

# 28. ADMIN ACTION CONFIRMATION

High-impact actions should require confirmation.

Examples:

### Delete/Archive Vendor

> Are you sure you want to archive this vendor?

### Promote Customer

> You are granting this user administrative access.

### Remove Admin

> This action will remove administrative access and may revoke active sessions.

### Suspend Vendor

> This vendor will no longer be able to accept new orders.

For critical operations, optionally require:

* Password re-entry
* MFA
* Confirmation code

Use the existing security infrastructure if available.

---

# 29. NOTIFICATION INTEGRATION

Integrate with the previously created Communication Management System.

Examples:

### Vendor Suspended

Notify:

* Vendor via Push
* Email
* In-App

### Vendor Approved

Notify vendor.

### Admin Promoted

Notify the user:

> Your account has been granted administrative access.

### Admin Access Removed

Notify the affected user.

Use the existing communication service rather than creating a second notification system.

---

# 30. DATABASE DESIGN

Adapt these concepts to the existing database.

Possible entities:

### vendors

```text
id
owner_user_id
business_name
description
category_id
logo_url
cover_image_url
phone
email
address
latitude
longitude
status
verification_status
created_at
updated_at
deleted_at
created_by
updated_by
```

### vendor_status_history

```text
id
vendor_id
previous_status
new_status
reason
changed_by
created_at
```

### roles

```text
id
name
description
system_role
created_at
updated_at
```

### permissions

```text
id
name
description
resource
action
created_at
```

### role_permissions

```text
role_id
permission_id
```

### user_roles

```text
user_id
role_id
assigned_by
assigned_at
```

### admin_actions / audit_logs

```text
id
actor_user_id
action
target_type
target_id
previous_value
new_value
reason
metadata
created_at
```

Use the existing role/permission tables if they already exist.

Do not create duplicate role tables.

---

# 31. API DESIGN

Follow the existing API conventions.

Potential endpoints:

## Vendors

```text
GET    /vendors
POST   /vendors
GET    /vendors/{id}
PUT    /vendors/{id}
DELETE /vendors/{id}

POST   /vendors/{id}/verify
POST   /vendors/{id}/reject
POST   /vendors/{id}/suspend
POST   /vendors/{id}/activate
POST   /vendors/{id}/archive
```

## Administration

```text
GET    /admins
GET    /admins/{id}

POST   /admins
PUT    /admins/{id}

POST   /admins/{id}/suspend
POST   /admins/{id}/activate
POST   /admins/{id}/remove-access

POST   /users/{id}/change-role
GET    /roles
GET    /permissions
```

## Audit

```text
GET /audit-logs
GET /audit-logs/{id}
```

Do not blindly implement these exact URLs. Adapt them to the existing backend routing conventions.

---

# 32. DATABASE TRANSACTIONS

Use database transactions for sensitive multi-step operations.

For example:

### Promote Customer → Admin

```text
BEGIN TRANSACTION

Validate actor permission

Validate target user

Validate role

Update user role

Create role assignment

Create audit log

Create notification event

COMMIT
```

If any critical operation fails:

```text
ROLLBACK
```

Do not leave the system in a partially updated state.

---

# 33. SEARCH & PAGINATION

All large datasets must support:

* Server-side pagination
* Search
* Filtering
* Sorting

Do not load all users/vendors into the browser.

Example:

```text
GET /vendors?page=1&limit=25&search=restaurant&status=active
```

---

# 34. UI/UX DESIGN

Use the existing dashboard design system.

The UI should be:

* Professional
* Clean
* Responsive
* Consistent
* Accessible
* Easy for administrators to understand

Use:

* Data tables
* Status badges
* Confirmation dialogs
* Drawer/modal forms where appropriate
* Tabs
* Search
* Filters
* Pagination
* Toast notifications
* Empty states
* Loading states
* Error states

Do not introduce an unrelated design language.

---

# 35. VENDOR STATUS BADGES

Use clear status indicators.

Examples:

```text
ACTIVE
PENDING
SUSPENDED
INACTIVE
ARCHIVED
```

Verification:

```text
VERIFIED
PENDING REVIEW
REJECTED
```

---

# 36. ADMIN STATUS

Possible statuses:

```text
ACTIVE
SUSPENDED
INACTIVE
```

Clearly distinguish:

**Role**

from

**Account Status**

Example:

```text
Role: Admin
Status: Suspended
```

A suspended Admin should not have active administrative access.

---

# 37. SECURITY REQUIREMENTS

Implement:

* Backend authorization
* Role-based access control
* Permission-based access control
* Input validation
* Output sanitization
* CSRF protection where applicable
* Rate limiting for sensitive endpoints
* Audit logging
* Session invalidation
* Secure file upload
* File type validation
* File size validation
* Secure environment variables
* No secrets in frontend code
* No trust in client-provided roles

Never accept:

```json
{
  "role": "super_admin"
}
```

from the frontend and assume it is valid.

The backend must determine whether the authenticated actor can perform the requested role assignment.

---

# 38. FILE UPLOAD SECURITY

Vendor images and documents must be validated.

Check:

* MIME type
* File extension
* File size
* Image dimensions where applicable

Rename uploaded files safely.

Do not trust filenames supplied by users.

Use existing storage infrastructure.

---

# 39. MOBILE APPLICATION IMPACT

If vendor status or role changes affect the mobile application, ensure those changes propagate correctly.

Examples:

### Vendor Suspended

Vendor should immediately stop receiving new orders.

### Vendor Reactivated

Vendor can become available again.

### Admin Role Removed

User should no longer have administrative privileges.

Use appropriate cache/session invalidation mechanisms.

---

# 40. TESTING REQUIREMENTS

Create comprehensive tests.

## Vendor Tests

Test:

* Create vendor
* Read vendor
* Update vendor
* Archive vendor
* Suspend vendor
* Activate vendor
* Verify vendor
* Reject vendor
* Search
* Filter
* Pagination
* Authorization

## Role Tests

Test:

* Customer → Admin
* Rider → Admin
* Vendor → Admin where allowed
* Admin → Customer
* Admin suspension
* Admin activation
* Permission changes
* Unauthorized role changes
* Admin attempting to create Super Admin
* Admin attempting to modify Super Admin
* Last Super Admin protection
* Self privilege escalation
* Session invalidation

## Security Tests

Test:

* Unauthorized API calls
* Manipulated role payloads
* Privilege escalation
* IDOR/resource access
* Invalid vendor IDs
* Unauthorized vendor modification
* Unauthorized admin creation
* Audit log integrity

---

# 41. IMPLEMENTATION PHASES

Do not implement everything blindly in one step.

Follow this process.

## Phase 1 — Codebase Analysis

Inspect:

* Existing users
* Authentication
* Roles
* Permissions
* Vendors
* Database
* API
* Dashboard
* Storage
* Notifications
* Audit logging
* Mobile app

Provide a concise report:

```text
Existing:
- Users
- Roles
- Permissions
- Vendor model
- Authentication

Reusable:
- Existing role system
- Existing file storage
- Existing notification system

Needs modification:
- ...

Needs creation:
- ...
```

---

## Phase 2 — Architecture

Provide:

* Component architecture
* Database changes
* API design
* Authorization model
* Service architecture
* UI architecture
* Security model
* Migration strategy

---

## Phase 3 — Backend

Implement:

1. Vendor models
2. Vendor CRUD
3. Vendor status management
4. Vendor verification
5. Role management
6. Admin management
7. Permission management
8. Audit logging
9. Authorization
10. Notifications
11. Session invalidation

---

## Phase 4 — Dashboard

Implement:

1. Vendor dashboard
2. Vendor list
3. Vendor details
4. Vendor create/edit forms
5. Vendor verification
6. Vendor suspension
7. Admin management
8. Customer management
9. Role assignment
10. Permission management
11. Audit logs

---

## Phase 5 — Integration

Integrate with:

* Authentication
* Communication Center
* Notifications
* Mobile app
* Existing analytics
* Existing audit logs

---

## Phase 6 — Testing

Run:

* Unit tests
* Integration tests
* API tests
* Authorization tests
* UI tests
* Security tests
* Regression tests

---

# 42. ACCEPTANCE CRITERIA

The feature is complete only when an authorized administrator can:

### Vendor Management

1. View all food vendors.
2. Search vendors.
3. Filter vendors.
4. Create vendors.
5. View vendor profiles.
6. Edit vendor information.
7. Verify vendors.
8. Reject vendor applications.
9. Suspend vendors.
10. Activate vendors.
11. Archive vendors.
12. View vendor history.
13. View vendor activity.
14. Access relevant vendor orders/menu/transactions.
15. See vendor analytics.

### Administration

16. View platform users.
17. View administrators.
18. Promote eligible customers to Admin.
19. Change user roles.
20. Remove Admin privileges.
21. Suspend administrators.
22. Reactivate administrators.
23. Assign/revoke permissions where authorized.
24. Prevent unauthorized role changes.
25. Prevent Admin → Super Admin escalation.
26. Prevent removal of the final active Super Admin.
27. Revoke sessions when critical role changes occur.
28. Record all sensitive actions in audit logs.

### Security

29. All sensitive operations are authorized on the backend.
30. Client-side role manipulation cannot bypass authorization.
31. Every role change is auditable.
32. Vendor status changes are auditable.
33. High-risk actions require confirmation.
34. Historical business records are preserved.
35. Existing functionality remains unaffected.

---

# 43. FINAL ENGINEERING REQUIREMENT

Treat this as a **production enterprise feature**, not a prototype.

Before writing implementation code:

1. Inspect the existing architecture.
2. Identify existing users, roles, permissions, vendor models, authentication, storage, notifications, and audit systems.
3. Reuse existing infrastructure wherever possible.
4. Clearly identify required database/API changes.
5. Explain your proposed architecture.
6. Then implement incrementally.
7. Do not rewrite unrelated parts of the application.
8. Do not introduce unnecessary dependencies.
9. Do not create duplicate systems.
10. Ensure backward compatibility.
11. Apply security at the backend level.
12. Include appropriate tests.
13. Document all new functionality.

The final result should feel like a **professional food-delivery platform administration system**, with a robust vendor management module and enterprise-grade role/permission management suitable for real production use.
