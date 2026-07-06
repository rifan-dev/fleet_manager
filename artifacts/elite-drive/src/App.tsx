import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { MainLayout } from "@/components/layout/main-layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Fleet from "@/pages/customer/fleet";
import VehicleDetail from "@/pages/customer/vehicle-detail";
import BookVehicle from "@/pages/customer/book-vehicle";
import ConfirmBooking from "@/pages/customer/confirm-booking";
import MyBookings from "@/pages/customer/my-bookings";
import Dashboard from "@/pages/admin/dashboard";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: any) {
  return (
    <Route {...rest}>
      {(params) => {
        const { user, isLoading } = useAuth();
        
        if (isLoading) {
          return <div className="min-h-screen w-full flex items-center justify-center">Loading...</div>;
        }
        
        if (!user) {
          return <Redirect to="/login" />;
        }
        
        if (adminOnly && user.role === "customer") {
          return <Redirect to="/fleet" />;
        }
        
        return (
          <MainLayout>
            <Component params={params} />
          </MainLayout>
        );
      }}
    </Route>
  );
}

// Admin/Staff Routes
import AdminVehicles from "@/pages/admin/vehicles";
import AdminBookings from "@/pages/admin/bookings";
import AdminUsers from "@/pages/admin/users";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/login" />} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Customer Routes */}
      <ProtectedRoute path="/fleet" component={Fleet} />
      <ProtectedRoute path="/vehicles/:id" component={VehicleDetail} />
      <ProtectedRoute path="/vehicles/:id/book" component={BookVehicle} />
      <ProtectedRoute path="/vehicles/:id/confirm" component={ConfirmBooking} />
      <ProtectedRoute path="/my-bookings" component={MyBookings} />
      
      {/* Admin/Staff Routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} adminOnly />
      <ProtectedRoute path="/admin/vehicles" component={AdminVehicles} adminOnly />
      <ProtectedRoute path="/admin/bookings" component={AdminBookings} adminOnly />
      <ProtectedRoute path="/admin/users" component={AdminUsers} adminOnly />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;