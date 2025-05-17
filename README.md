# Firebase Studio - ABASBlogs

This is a Next.js application for ABASBlogs, a simple blogging platform, built in Firebase Studio.

## Getting Started

### Prerequisites

- Node.js (version 18.x or later recommended)
- npm or yarn

### Installation

1. Clone the repository (if applicable) or ensure you have the project files.
2. Navigate to the project directory:
   ```bash
   cd your-project-name
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

### Running the Development Server

To start the development server (usually on http://localhost:9002 as per your `package.json`):
```bash
npm run dev
```
or
```bash
yarn dev
```
The app will automatically reload if you change any of the source files.

### Building for Production

To create an optimized production build:
```bash
npm run build
```
or
```bash
yarn build
```
This command will generate a `.next` folder with the production build of your application.

### Starting the Production Server

After building the application, you can start the production server:
```bash
npm run start
```
or
```bash
yarn start
```
This will serve the optimized application.

## Key Technologies

- Next.js (App Router)
- React
- ShadCN UI components
- Tailwind CSS
- Genkit (for potential AI features)
- better-sqlite3 (for local database)
- react-markdown remark-gfm

## Project Structure Overview

- `src/app/`: Contains the core application pages and layouts (using Next.js App Router).
  - `page.tsx`: The homepage displaying a list of blog posts.
  - `posts/[id]/page.tsx`: The page for viewing a single blog post.
  - `posts/create/page.tsx`: The page with the form to create a new blog post.
- `src/components/`: Reusable React components.
  - `ui/`: ShadCN UI components.
  - `Header.tsx`: The main site header.
  - `Footer.tsx`: The main site footer.
  - `PostCard.tsx`: Component to display a single post preview.
  - `PostForm.tsx`: Form component for creating/editing posts.
  - `DeleteConfirmationDialog.tsx`: Dialog for confirming post deletion.
- `src/lib/`: Utility functions, server actions, and database logic.
  - `actions.ts`: Server actions for interacting with blog post data (CRUD operations).
  - `db.ts`: SQLite database setup and connection.
  - `data.ts`: Initial seed data for posts (used if the database is empty).
- `src/types/`: TypeScript type definitions.
- `src/ai/`: Genkit related files for AI features.
  - `genkit.ts`: Genkit initialization.
  - `dev.ts`: Development server entry point for Genkit flows.

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in development mode with Turbopack.
- `npm run genkit:dev`: Starts the Genkit development server.
- `npm run genkit:watch`: Starts the Genkit development server with watch mode.
- `npm run build`: Builds the app for production.
- `npm run start`: Starts a Next.js production server.
- `npm run lint`: Runs Next.js' built-in ESLint checks.
- `npm run typecheck`: Runs TypeScript type checking.
