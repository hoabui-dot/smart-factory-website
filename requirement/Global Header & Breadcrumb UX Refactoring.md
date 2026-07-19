# Global Header & Breadcrumb UX Refactoring

## Objective

Refactor the header area of every page across the SmartFactory application.

The current page headers contain too much information, making the interface look like technical documentation instead of an enterprise manufacturing application.

The goal is to reduce visual noise, improve scanability, and make every page immediately understandable for operators, warehouse users, supervisors, planners and engineers.

Do not modify business logic.

Only improve layout and UX.

---

# General Rule

A page header should answer only three questions:

1. Where am I?

2. What am I managing?

3. What is the primary action?

Everything else should be removed or relocated.

---

# Remove Unnecessary Information

Across the entire application, remove the following items from page headers.

• Internal page IDs

Example

WEB-MES-01-ITEM-MASTER

WEB-WMS-01-LOCATION

WEB-QMS-...

These are developer identifiers, not useful for end users.

---

Remove route paths

Example

/web/mes/items

/web/wms/locations

Users never need to see URLs.

---

Remove duplicated module descriptions.

Example

"Quản lý item master..."

"Import/export..."

"Mutation gated..."

Long descriptions should not appear on every page.

If documentation is required, move it into:

Help button

Tooltip

Documentation page

Developer mode

---

Remove unnecessary navigation links.

Examples

Back to Home

Import Center

Dashboard

If users already have the left navigation menu, do not duplicate navigation links inside every page header.

Only keep them when there is a real workflow dependency.

---

# New Header Structure

Every page should follow this structure.

------------------------------------------------

Breadcrumb

Page Title

Page Actions

------------------------------------------------

Nothing else.

No long descriptions.

No route names.

No page IDs.

No duplicated links.

---

# Breadcrumb Design

Redesign breadcrumb across the entire application.

Current breadcrumb is difficult to read and contains technical information.

Use this format:

Home

>

MES

>

Item Master

or

Home

>

WMS

>

Locations

or

Home

>

QMS

>

Inspection Results

Rules

Maximum 3 levels

No route paths

No page codes

No ALL CAPS

No technical IDs

No developer terminology

Use natural business language.

---

Breadcrumb Style

Font

12px

Weight

500

Color

Gray

Separator

Chevron >

Current Page

Semi Bold

Dark Text

Previous Items

Clickable

Hover underline

---

# Page Title

This becomes the primary visual element.

Font

28px

Weight

700

Color

Primary Text

Examples

Item Master

Location Master

Routing

Inventory

Production Orders

Quality Inspection

Do not repeat module names inside the title.

Bad

MES Item Master

Good

Item Master

---

# Optional Subtitle

Subtitle is optional.

Only display when it provides business value.

Maximum one sentence.

Maximum 80 characters.

Examples

Manage materials used in production.

Manage warehouse locations.

Review inspection results.

Do not display technical implementation details.

---

# Page Actions

Move all actions to the top-right.

Examples

Create

Import

Export

Refresh

Print

Do not duplicate navigation buttons.

Only business actions belong here.

Limit primary buttons to one.

Everything else should be secondary.

---

# Search & Filters

Move search and filters into a dedicated Toolbar below the page header.

Never place search inside the page title area.

Toolbar contains

Search

Filters

Sort

Quick Actions

Refresh

Export

All aligned horizontally.

---

# Visual Hierarchy

Priority

1. Page Title

2. Primary Button

3. Search Toolbar

4. Data

Everything else becomes secondary.

---

# Responsive Rules

Desktop

Breadcrumb

↓

Title + Actions

↓

Toolbar

↓

Content

Tablet

Actions collapse into overflow menu.

Mobile

Breadcrumb collapses.

Primary button remains visible.

---

# Accessibility

Breadcrumb keyboard navigable.

Current page uses aria-current.

Minimum touch target

40px.

---

# Consistency

Apply this header pattern to every page including:

MES

WMS

QMS

Administration

Dashboard

Reports

Approval

Master Data

Monitoring

Settings

Import/Export

Audit

Notifications

No page should use a different header layout.

The entire application must feel like one unified enterprise product.

---

# Final Goal

When users open any page, they should immediately recognize:

• where they are

• what they are managing

• what they can do next

without reading technical descriptions, internal IDs or developer metadata.