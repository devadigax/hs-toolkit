# HS Toolkit

A HubSpot Toolkit dashboard application built with Next.js, Shadcn/UI, and the HubSpot API.

## Features

-   **Dashboard**: Overview of Contacts, Companies, Deals, Tickets, Products, Quotes, and Line Items.
-   **Data Fetching**: Optimized fetching with batch API logic for associations.
-   **Search**: Quick search across objects with support for filtering (e.g., Active/Inactive Products).
-   **Security**: Direct API communication from the browser/Next.js server side without persistent data storage on our servers.
-   **UI/UX**: Modern, responsive interface using Shadcn/UI components.

## Getting Started

### Prerequisites

-   Node.js 18+
-   HubSpot Developer Account
-   HubSpot App with OAuth Scopes (crm.objects.contacts.read, etc.) or Private App Access Token

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/devadigax/hs-toolkit.git
    cd hs-toolkit
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env.local` file with:
    ```env
    HUBSPOT_ACCESS_TOKEN=your_access_token
    # Or for OAuth
    HUBSPOT_CLIENT_ID=your_client_id
    HUBSPOT_CLIENT_SECRET=your_client_secret
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## Tech Stack

-   **Framework**: Next.js 14 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Components**: Shadcn/UI
-   **API Integration**: HubSpot Client Library for Node.js

## License

This project is licensed under the MIT License.
