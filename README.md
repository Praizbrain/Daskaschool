# Praiseland Finance Hub

You are a Senior Product Designer, UX Architect, Design Systems Engineer, and Fintech SaaS Designer.



Design a complete modern web application prototype for a School Finance Operating System.



This is NOT a generic school management system.



The purpose of this product is to help school owners manage their finances, bookkeeping, revenue, student payments, inventory, expenses, profitability and financial reports.



The software is being designed specifically for a private school in Nigeria called:



Divine Sources Praiseland High School



The users are not tech savvy.



The UI must feel extremely simple, modern, elegant and trustworthy.



The product should feel like a combination of Stripe Dashboard, Mercury Bank, Linear, Notion and modern SaaS products while remaining simple enough for a school secretary to use without training.



DO NOT use generic AI blue.



---------------------------------------------------------



COLOR SYSTEM



Primary:

Deep Emerald (#0F766E)



Secondary:

Warm Gold (#C89B2B)



Background:

#F7F8F5



Surface:

#FFFFFF



Text Primary:

#111827



Text Secondary:

#6B7280



Success:

#15803D



Warning:

#F59E0B



Danger:

#DC2626



Borders:

Very soft gray



Charts:

Emerald

Gold

Olive

Slate



No gradients.



Use subtle shadows.



Large spacing.



16px corner radius.



Premium appearance.



---------------------------------------------------------



TYPOGRAPHY



Modern sans serif.



Large headings.



Excellent whitespace.



Readable tables.



Large clickable buttons.



Designed for office workers.



---------------------------------------------------------



DESIGN STYLE



Minimal



Professional



Premium



Clean



Financial dashboard



Not playful.



Not childish.



No glassmorphism.



No neumorphism.



No bright blue.



---------------------------------------------------------



APPLICATION NAME



Divine Sources Finance OS



Subtitle:



School Finance & Operations



---------------------------------------------------------



PRODUCT GOAL



The application should allow school owners to:



Track school fees



Track books sold



Track uniforms



Track sneakers



Track inventory



Track teacher salaries



Track expenses



Track revenue



Estimate expected revenue for the current term



Estimate profit



Monitor payment targets



Generate reports



Monitor financial health



The application is NOT for parents.



Only internal staff.



---------------------------------------------------------



USER ROLES



Super Admin



Has complete access.



Can configure everything.



Admin



Can perform duties of:



Secretary



Bursar



HM



Can:



Record payments



Manage students



Manage inventory



View reports



Cannot modify system configuration.



No Teacher role yet.



---------------------------------------------------------



DESIGN A COMPLETE PROTOTYPE



Include navigation between all pages.



Every button should navigate somewhere.



Use realistic dummy data.



---------------------------------------------------------



SIDEBAR



Dashboard



Students



Classes



Finance



Inventory



Expenses



Staff



Reports



Targets



Settings



Bottom:



Profile



Logout



---------------------------------------------------------



TOP NAVIGATION



Global Search



Current Academic Session



Current Term



Notification Bell



Profile Menu



---------------------------------------------------------



PAGE 1



LOGIN



School logo



Welcome back



Email



Password



Remember Me



Forgot Password



Login



Modern illustration



---------------------------------------------------------



PAGE 2



DASHBOARD



Large financial overview.



Top cards:



Expected Revenue



Collected Revenue



Outstanding Revenue



Estimated Net Profit



Today's Revenue



Today's Expenses



Below:



Revenue Collection Progress



Large circular progress indicator.



Below:



Revenue by Section



KG



Primary



JSS



SS



Each with progress bars.



Below:



Outstanding Students



Recent Payments



Recent Expenses



Quick Actions



+ Add Student



+ Record Payment



+ Add Expense



+ Add Staff



---------------------------------------------------------



PAGE 3



STUDENTS



Search



Filter



Student Table



Columns:



Photo



Student Name



Class



Guardian



Outstanding Balance



Payment Status



Actions



Clicking a student opens:



Student Profile



---------------------------------------------------------



PAGE 4



STUDENT PROFILE



Profile Header



Student information



Guardian details



Current Class



Payment Summary



Outstanding Balance



Discount



Tabs



Overview



Payments



Purchases



Notes



Documents



Timeline of payments.



---------------------------------------------------------



PAGE 5



ADD STUDENT



Modern multi-step form.



Step 1



Bio



Step 2



Guardian



Step 3



Class



Step 4



Fee Structure



Step 5



Discount



Step 6



Review



---------------------------------------------------------



PAGE 6



CLASSES



Beautiful cards.



Each card shows:



Class Name



Students



Expected Revenue



Collected Revenue



Outstanding



Collection %



Clicking opens Class Details.



---------------------------------------------------------



PAGE 7



CLASS DETAILS



Overview



Students



Revenue



Teacher Salary



Expenses



Estimated Profit



Student List



Payment Completion



---------------------------------------------------------



PAGE 8



FINANCE



Tabs



Payments



Revenue



School Fees



Sales



Profit



Ledger style interface.



Large button



Record Payment



---------------------------------------------------------



PAGE 9



RECORD PAYMENT



Search Student



Select Outstanding Items



Checkboxes:



School Fees



Books



Uniform



Sneakers



Exam Fee



Lesson Fee



Custom Item



Amount



Payment Method



Cash



Transfer



POS



Bank Account Received



Receipt Number



Notes



Generate Receipt



Save Payment



---------------------------------------------------------



PAGE 10



INVENTORY



Cards



Books



Uniforms



Sneakers



Exercise Books



ID Cards



Stationery



Each item shows



Stock



Cost Price



Selling Price



Profit



Edit



---------------------------------------------------------



PAGE 11



EXPENSES



Expense Table



Large button



Add Expense



Form:



Category



Amount



Description



Date



Paid To



Payment Method



Attachment



---------------------------------------------------------



PAGE 12



STAFF



Cards



Staff Name



Role



Salary



Assigned Section



Status



Click to View



---------------------------------------------------------



PAGE 13



REPORTS



Cards



Daily Revenue



Weekly Revenue



Monthly Revenue



Term Report



Profit Report



Outstanding Report



Expense Report



Inventory Report



Export buttons



PDF



Excel



CSV



---------------------------------------------------------



PAGE 14



TARGETS



Overall Collection Target



Large Progress Ring



Below



Collection by:



KG



Primary



JSS



SS



Each card displays



Expected



Collected



Outstanding



Completion %



---------------------------------------------------------



PAGE 15



SETTINGS



School Profile



Academic Sessions



Terms



Fee Structure



Discount Rules



Inventory Categories



Expense Categories



Bank Accounts



User Management



Audit Logs



---------------------------------------------------------



DESIGN COMPONENTS



Create reusable components for:



Sidebar



Navbar



Metric Cards



Buttons



Tables



Forms



Dropdowns



Search



Student Card



Class Card



Progress Ring



Progress Bar



Charts



Modals



Empty States



Toasts



Status Badges



Pagination



---------------------------------------------------------



IMPORTANT BUSINESS LOGIC



The dashboard should visually communicate that Expected Revenue is calculated automatically using:



Students



×



Fees



−



Discounts



+



Extra Charges



When payments are recorded, the Collection Progress updates.



When expenses are added, Estimated Profit updates.



When teacher salaries change, Estimated Profit recalculates.



Represent this visually in the dashboard.



---------------------------------------------------------



PROTOTYPE FLOW



Login



↓



Dashboard



↓



Students



↓



Student Profile



↓



Record Payment



↓



Generate Receipt



↓



Dashboard updates



↓



Reports



Create clickable interactions between these pages.



---------------------------------------------------------



DESIGN QUALITY



The result should look like a real startup preparing for launch, not an AI-generated dashboard.



Prioritize spacing, hierarchy, usability and clarity.



Every page should be polished enough to present to investors or stakeholders.



Use realistic charts, tables, cards, and financial widgets.



The final result should feel like a premium finance operating system built specifically for schools.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d7c635be-b50a-46f6-80b8-5cf13bf6bdac).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
