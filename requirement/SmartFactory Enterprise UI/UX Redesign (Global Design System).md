# SmartFactory Enterprise UI/UX Redesign (Global Design System)

## Objective

Refactor the entire SmartFactory web application into a modern Enterprise MES/WMS interface.

The current UI behaves like a traditional CRUD admin system.
It should instead look similar to modern industrial software such as:

- SAP Fiori
- Siemens Opcenter
- Tulip
- Ignition Perspective
- Rockwell FactoryTalk
- Oracle Manufacturing Cloud

The redesign must preserve all existing business logic and API contracts.
Only improve UI, UX, spacing, typography, layout hierarchy, consistency and responsiveness.

Do NOT redesign into a consumer application.
This is an enterprise manufacturing system used 8~12 hours/day by operators, warehouse staff, planners and engineers.

---

# Global Design Principles

The entire application must follow these principles.

1. Reduce visual noise.

Remove unnecessary borders.
Use whitespace instead of separators whenever possible.

2. Increase information density.

Enterprise users need to scan large amounts of information quickly.

3. Consistent spacing.

Every page should follow the same spacing system.

4. Primary content first.

Users should immediately understand:

- where they are
- what they are looking at
- what action is available

5. One visual language across all pages.

Every module (MES/WMS/QMS/Admin) must use identical layout rules.

---

# Typography

Replace inconsistent typography with a complete type scale.

Font Family

IBM Plex Sans

Fallback

Inter
Segoe UI
Roboto
sans-serif

Font Weight

400 Regular
500 Medium
600 SemiBold

Never use Bold (700) except page title.

Typography Scale

Page Title
28px
700

Section Title
20px
600

Card Title
18px
600

Table Header
14px
600

Normal Text
14px
400

Secondary Text
13px
400

Caption
12px
400

Button Text
14px
500

Breadcrumb
12px

Input Label
13px

Input Text
14px

Table Row Height

48px

Line Height

1.45

---

# Spacing System

Use an 8pt spacing grid.

Allowed spacing only:

4
8
12
16
20
24
32
40

Never use random spacing.

Page Padding

24px

Section Gap

24px

Card Padding

20px

Table Header Padding

16px

Input Height

40px

Button Height

40px

Small Button

32px

---

# Color Usage

Reduce heavy blue usage.

Blue should represent only:

Primary Action

Links

Selected Row

Focus State

Everything else should be neutral.

Background

#F7F8FA

Card

#FFFFFF

Border

#E5E7EB

Primary Text

#111827

Secondary Text

#6B7280

Hover

Very light gray

Selected Row

Soft Blue

Danger

Red

Warning

Orange

Success

Green

---

# Card Style

Avoid multiple nested cards.

Every page should have:

Page

↓

Content Sections

↓

Table

↓

Detail Panel

Do not wrap every element inside another bordered card.

Border Radius

10px

Shadow

Very subtle

---

# Standard Enterprise Layout

Every CRUD page must use exactly the same layout.

-----------------------------------------

Breadcrumb

Page Title

Description

Primary Actions

-----------------------------------------

Toolbar

Search

Filters

Quick Actions

-----------------------------------------

Main Content

Master Panel

Detail Panel

-----------------------------------------

Pagination

Status

-----------------------------------------

No unnecessary separators.

---

# Sidebar

Reduce width.

Current sidebar wastes horizontal space.

New Width

240px

Collapsed

72px

Navigation Items

Height

40px

Active Item

Blue left indicator

Soft blue background

Hover

Light gray

Icons

18px

Text

14px Medium

---

# Header

Reduce vertical height.

Current header is too tall.

Header Height

64px

Move:

Theme Toggle

User

Logout

into a compact right aligned area.

Page title should be visually dominant.

---

# Breadcrumb

Make breadcrumb smaller.

12px

Gray

Uppercase module

Normal page title below it.

---

# Buttons

Only one Primary button per page.

Everything else should be Secondary or Ghost.

Primary

Filled Blue

Secondary

White

Gray Border

Ghost

No Border

Danger

Red

Never make every action blue.

---

# Search Toolbar

Current search area wastes vertical space.

Convert it into one horizontal toolbar.

Search

↓

Filter

↓

Actions

Everything aligned on one row.

---

# Data Table

Use enterprise table style.

Sticky Header

Row Height

48px

Header Height

44px

Alternate Hover

Selected Row Highlight

Right aligned numbers

Left aligned text

Status Badge instead of plain text

Reduce vertical borders.

Only horizontal separators.

---

# Detail Panel

Current detail panel is empty and visually disconnected.

Redesign into an Information Panel.

Width

380~420px

Sticky

Grouped Information

General

Hierarchy

Configuration

Metadata

Audit

Actions

Each group uses section title.

---

# Tree Navigation

The tree should become a left navigation component.

Current tree wastes vertical space.

Instead:

Location Tree

↓

Scrollable

↓

Collapsible

↓

Sticky

↓

Width 260px

Selecting a node immediately filters the table.

---

# Location Page Layout

Current Layout

Tree Card

↓

Search

↓

Table

↓

Empty Detail

New Layout

--------------------------------------------------------

Toolbar

--------------------------------------------------------

Location Tree

|

Location Table

|

Location Detail

--------------------------------------------------------

Three-column enterprise workspace.

Suggested Width

Tree

260px

Table

flex

Detail

400px

The page should use the entire monitor width.

---

# Table Improvements

Replace

yes/no

with colored status badges.

Display hierarchy using indentation.

Highlight selected location.

Allow double click to edit.

Show row hover.

Improve scanability.

---

# Empty State

Never show blank panels.

Display

icon

title

description

"Select a location to view details."

---

# Responsive Rules

Desktop

Three columns

Tablet

Tree collapsible

Detail drawer

Mobile

Stack vertically

---

# Interaction

Hover

100ms

Transition

150ms

Focus

Accessible

Keyboard Navigation

Supported

---

# Design Tokens

Convert all spacing, typography, radius and colors into reusable design tokens.

No hardcoded values.

Every page must consume the same token system.

---

# Global Requirement

Apply this design system consistently across ALL pages.

This includes:

- MES
- WMS
- QMS
- Admin
- Dashboard
- Reports
- Master Data
- CRUD Pages
- Approval Pages
- Monitoring Pages

Every page should share identical:

- typography
- spacing
- toolbar
- table
- cards
- detail panels
- buttons
- forms
- pagination
- navigation
- responsive behavior

The final result should feel like a professional Enterprise Manufacturing System instead of a generic admin dashboard.