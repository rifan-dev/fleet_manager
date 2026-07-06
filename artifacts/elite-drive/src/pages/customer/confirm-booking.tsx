import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useGetVehicle, useCreateBooking } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, ShieldCheck, Smartphone, CreditCard, Building2, Wallet } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS = [
  {
    id: "upi",
    label: "UPI",
    desc: "GPay, PhonePe, Paytm",
    icon: Smartphone,
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    desc: "Visa, Mastercard, RuPay",
    icon: CreditCard,
  },
  {
    id: "netbanking",
    label: "Net Banking",
    desc: "All major Indian banks",
    icon: Building2,
  },
  {
    id: "cash",
    label: "Cash at Pickup",
    desc: "Pay in person at the counter",
    icon: Wallet,
  },
];

export default function ConfirmBooking() {
  const [, params] = useRoute("/vehicles/:id/confirm");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState("");

  const searchParams = new URLSearchParams(window.location.search);
  const pickupDate = searchParams.get("pickup") || "";
  const returnDate = searchParams.get("return") || "";

  const { data: vehicle, isLoading } = useGetVehicle(id, {
    query: { enabled: !!id },
  });

  const createBookingMutation = useCreateBooking();

  if (isLoading || !vehicle) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!pickupDate || !returnDate) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive mb-4">Missing dates for booking.</p>
        <Link href={`/vehicles/${id}/book`}>
          <Button variant="outline">Go back</Button>
        </Link>
      </div>
    );
  }

  const dPickup = parseISO(pickupDate);
  const dReturn = parseISO(returnDate);
  const duration = Math.max(1, differenceInDays(dReturn, dPickup));
  const totalCost = duration * Number(vehicle.dailyRate);

  const handleConfirm = () => {
    if (!paymentMethod) return;
    createBookingMutation.mutate(
      { data: { vehicleId: vehicle.id, pickupDate, returnDate } },
      {
        onSuccess: () => {
          toast({
            title: "Booking Confirmed!",
            description: "Your reservation has been successfully created.",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
          queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
          setLocation("/my-bookings");
        },
        onError: (err: any) => {
          toast({
            title: "Booking Failed",
            description: err?.data?.error || "Could not complete the booking.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href={`/vehicles/${id}/book`}
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dates
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Confirm Reservation</h1>
        <p className="text-muted-foreground mt-1">
          Review your details and choose a payment method
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-border/60 overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-muted aspect-video md:aspect-auto flex items-center justify-center">
              {vehicle.imageUrl ? (
                <img
                  src={vehicle.imageUrl}
                  alt=""
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="font-bold text-xl text-primary/40 uppercase tracking-widest">
                  {vehicle.make}
                </span>
              )}
            </div>
            <div className="p-6 md:w-2/3 flex flex-col justify-center">
              <h2 className="text-2xl font-bold">
                {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-muted-foreground mb-4">
                {vehicle.year} • {vehicle.category}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm mt-auto pt-4 border-t border-border/40">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                    Pick-up
                  </p>
                  <p className="font-medium">
                    {format(dPickup, "EEE, MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                    Return
                  </p>
                  <p className="font-medium">
                    {format(dReturn, "EEE, MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Method
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select how you'd like to pay for this booking
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const selected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
                      selected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/50 hover:border-primary/40 hover:bg-muted/30"
                    )}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p
                        className={cn(
                          "font-semibold text-sm",
                          selected && "text-primary"
                        )}
                      >
                        {method.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {method.desc}
                      </p>
                    </div>
                    {selected && (
                      <CheckCircle2 className="h-5 w-5 text-primary ml-auto shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/60 bg-muted/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Included
                Benefits
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Comprehensive Insurance Coverage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>24/7 Roadside Assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Free cancellation up to 48h before</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/60 border-primary/20 shadow-sm shadow-primary/5">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-lg">Price Breakdown</h3>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    ₹{Number(vehicle.dailyRate).toLocaleString("en-IN")} ×{" "}
                    {duration} days
                  </span>
                  <span>₹{totalCost.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST & Taxes</span>
                  <span>Included</span>
                </div>
              </div>
              <div className="pt-4 border-t border-border/40 flex justify-between items-center mb-6">
                <span className="font-bold text-lg">Total</span>
                <span className="text-3xl font-bold text-primary tracking-tight">
                  ₹{totalCost.toLocaleString("en-IN")}
                </span>
              </div>

              {!paymentMethod && (
                <p className="text-xs text-muted-foreground text-center mb-3">
                  Please select a payment method above to continue
                </p>
              )}

              <Button
                onClick={handleConfirm}
                className="w-full font-bold h-12 text-base"
                disabled={createBookingMutation.isPending || !paymentMethod}
              >
                {createBookingMutation.isPending
                  ? "Confirming..."
                  : paymentMethod
                  ? `Pay with ${PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}`
                  : "Select Payment Method"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
