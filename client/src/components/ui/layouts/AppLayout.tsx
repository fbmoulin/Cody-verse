import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster"

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}