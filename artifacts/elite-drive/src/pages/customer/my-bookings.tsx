import { useListBookings } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function MyBookings() {
  const { user } = useAuth();
  
  const { data: bookings, isLoading } = useListBookings({ 
    userId: user?.id 
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading your bookings...</div>;
  }

  const activeBookings = bookings?.filter(b => b.status === "active" || b.status === "pending" || b.status === "confirmed") || [];
  const pastBookings = bookings?.filter(b => b.status === "completed" || b.status === "cancelled") || [];

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground mt-1">Manage your upcoming and past reservations</p>
      </div>

      {(!bookings || bookings.length === 0) ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-border/60">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No bookings yet</h2>
          <p className="text-muted-foreground mb-6">You haven't made any reservations with Elite Drive.</p>
          <Link href="/fleet">
            <Button>Browse Fleet</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {activeBookings.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Active & Upcoming
              </h2>
              <div className="grid gap-4">
                {activeBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </section>
          )}

          {pastBookings.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Past Bookings</h2>
              <div className="grid gap-4 opacity-80">
                {pastBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking }: { booking: any }) {
  const dPickup = parseISO(booking.pickupDate);
  const dReturn = parseISO(booking.returnDate);

  return (
    <Card className="overflow-hidden border-border/60 hover:border-primary/20 transition-colors">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-48 bg-muted shrink-0 flex items-center justify-center p-4">
          {booking.vehicle?.imageUrl ? (
            <img src={booking.vehicle.imageUrl} alt="" className="object-cover w-full h-24 sm:h-full rounded-md" />
          ) : (
            <span className="font-bold text-muted-foreground uppercase tracking-wider">{booking.vehicle?.make || 'Vehicle'}</span>
          )}
        </div>
        <CardContent className="p-6 flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg leading-none mb-1">
                {booking.vehicle?.make} {booking.vehicle?.model}
              </h3>
              <p className="text-sm text-muted-foreground">Booking #{booking.id.toString().padStart(6, '0')}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Dates</p>
              <p className="font-medium">{format(dPickup, "MMM d")} - {format(dReturn, "MMM d, yyyy")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{booking.durationDays} days</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Total Cost</p>
              <p className="font-bold text-primary text-base">₹{Number(booking.totalCost).toLocaleString("en-IN")}</p>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}