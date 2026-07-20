# SmartFactory Application Shell UX Refactoring

## Objective

Review and redesign the entire authenticated application shell of SmartFactory.

The current UI has already standardized page layouts, tables, dialogs and forms.

The next step is to improve the overall user experience of the application shell.

Think like a Senior Product Designer designing an Enterprise Manufacturing Platform.

Do not redesign individual CRUD pages.

Instead, redesign the experience around them.

Focus on

- Login
- Authentication flow
- Application Shell
- Sidebar
- Top Navigation
- User Profile
- Account Menu
- Logout
- RBAC Navigation
- Global Search
- Notifications
- Session UX

The result should resemble enterprise software such as

- SAP Fiori

- Microsoft Dynamics 365

- Oracle Fusion

- Siemens Opcenter

- Atlassian Administration

without changing business logic.

---

# Review the Entire Information Architecture

Analyze every page.

Analyze every navigation item.

Analyze every authenticated workflow.

Question every menu item.

Question every button.

Question every navigation decision.

Do not assume the current navigation is correct.

Optimize for

- discoverability

- efficiency

- consistency

- daily usage

---

# Sidebar Navigation

Current sidebar has too many flat menu items.

Refactor the navigation into business-oriented groups.

Example

Dashboard

My Work

Approvals

--------------------------------

Manufacturing (MES)

Item Master

Routing

Work Orders

Production

Engineering

--------------------------------

Warehouse (WMS)

Locations

Inventory

Goods Receipt

Goods Issue

Lots

Suppliers

--------------------------------

Quality (QMS)

Inspection

Checksheet

NCR

Documents

--------------------------------

Administration

Users

Roles & Permissions

Reference Data

Notifications

Worker Jobs

Events

Audit Logs

--------------------------------

System

Profile

Preferences

Help

Each group should be collapsible.

Remember expanded state.

Reduce scrolling.

Improve discoverability.

---

# Remove Developer Thinking

Users should never navigate by technical module names.

Navigation should use business terminology.

Example

Bad

RBAC

Identity

Notification Delivery

Worker Jobs

Good

Roles & Permissions

User Management

Notification Center

Background Jobs

System Events

Audit Logs

---

# Top Navigation

Redesign the top-right area.

Current

Theme

Username

Logout Button

Replace with a unified user menu.

Example

Avatar

↓

User Name

↓

Dropdown

Profile

Preferences

Theme

Language

Keyboard Shortcuts

Help

Sign Out

Remove the standalone Logout button.

Sign Out belongs inside the profile menu.

---

# User Profile

Create a dedicated profile experience.

Include

Avatar

Full Name

Employee ID

Department

Assigned Roles

Assigned Locations

Last Login

Password

Preferences

Theme

Language

Notification Preferences

Do not overload the top navigation with user information.

---

# Logout Experience

Current logout button feels disconnected.

Move Sign Out into the profile dropdown.

Before logout

If unsaved changes exist

display confirmation.

Otherwise

logout immediately.

After logout

Return to login page.

Clear session cleanly.

Preserve theme preference.

Preserve remembered email if enabled.

---

# RBAC Experience

Review every RBAC-related screen.

Current naming is too technical.

Rename concepts using business language.

Example

Roles

Permissions

Access Policies

Assigned Users

Location Scope

Capability Matrix

Hide implementation terminology.

Improve hierarchy.

Separate

Role Management

Permission Catalog

User Assignment

Audit History

instead of mixing everything together.

---

# Notification Experience

Move notifications into a dedicated bell icon.

Display unread count.

Dropdown preview

Recent notifications

Mark all as read

Open Notification Center

Do not place notifications inside the sidebar.

---

# Global Search

Introduce an application-wide search.

Users should quickly search

Items

Work Orders

Locations

Customers

Suppliers

Documents

Users

Commands

Navigation

Similar to

Microsoft Dynamics

Atlassian

Linear

Open using

Ctrl + K

or

⌘ + K

---

# Quick Actions

Add a global Create menu.

Example

+

↓

New Work Order

New Item

New Location

New User

New Supplier

Only display actions allowed by RBAC.

---

# Session Awareness

Improve enterprise session UX.

Display

Current Factory

Current Environment

Production

UAT

DEV

Connection Status

Online

Offline

Syncing

Session Timeout Warning

Show before automatic logout.

---

# Personalization

Allow users to configure

Theme

Density

Language

Default Landing Page

Sidebar Collapse

Favorite Pages

Recent Pages

Remember these locally.

---

# Favorites

Allow users to pin frequently used pages.

Example

Favorites

Work Orders

Inventory

Locations

Production Dashboard

Users should not repeatedly navigate through long menus.

---

# Recently Visited

Maintain navigation history.

Display inside the profile menu or sidebar.

Last 5 pages.

---

# Help

Replace technical documentation links.

Add

Help Center

Keyboard Shortcuts

Release Notes

Support

About SmartFactory

---

# Accessibility

Every navigation item

Keyboard accessible.

Visible focus.

ARIA labels.

High contrast.

Minimum touch target

40px.

---

# Responsive Behaviour

Desktop

Persistent sidebar.

Tablet

Collapsible sidebar.

Mobile

Drawer navigation.

Profile menu remains consistent.

---

# Design Consistency

Every global component must follow the design system.

IBM Plex Sans

Shared spacing

Shared colors

Shared icons

Shared dropdown styles

Shared dialog styles

Shared menu styles

Shared animations

No page should introduce a different navigation pattern.

---

# Final Deliverables

Review the entire authenticated experience and refactor it into a cohesive enterprise application shell.

Identify:

- redundant menu items
- duplicated navigation
- unnecessary buttons
- misplaced actions
- confusing terminology
- inconsistent account management
- poor RBAC discoverability

Then implement a cleaner, role-oriented navigation structure that improves usability without changing business logic.

The final application should feel like a modern Enterprise Manufacturing Platform used daily in factories rather than a collection of independent CRUD pages.