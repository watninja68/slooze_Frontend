# **App Name**: Slloze Restaurant

## Core Features:

- Restaurant List: Display a scrollable list of restaurants with menus. All restaurants shown depend on the user's permissions, and the administrator can see all of them.
- Order Creation: Display an order summary and provide the ability to confirm the order.
- Order Details: Displays order information. Includes conditional display for Admin / Managers, who can cancel existing orders. This is not visible for regular members.
- RBAC Implementation: Restrict restaurant list contents based on RBAC rules. Members will only see orders for their specific region, but admins see them all.
- Payment Management: Admins are presented with a way to update existing payment methods.
- Role-based access control: Provides access controls to various features, limiting order modification capabilities based on the current logged in user.

## Style Guidelines:

- Primary color: Saturated sky blue (#4BABFF) to represent trust and reliability, which can fit for a food ordering application.
- Background color: Light grayish blue (#D9E2EC), providing a calm and clean backdrop.
- Accent color: A soft, muted green (#72B01D) to draw attention to calls to action, while still meshing naturally with the sky blue.
- Clean and modern font for headers, sans-serif.
- Readable sans-serif font for body text, chosen for clarity.
- Consistent, minimalist icons for navigation and actions.
- Grid-based layout for responsive design.