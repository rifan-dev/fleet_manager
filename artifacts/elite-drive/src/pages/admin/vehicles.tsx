import { useState } from "react";
import { 
  useListVehicles, 
  useCreateVehicle, 
  useUpdateVehicle, 
  useDeleteVehicle,
  VehicleCategory,
  VehicleTransmission
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";

export default function AdminVehicles() {
  const [search, setSearch] = useState("");
  const { data: vehicles, isLoading } = useListVehicles(search ? { search } : {});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
          toast({ title: "Vehicle deleted successfully" });
        }
      });
    }
  };

  const handleToggleAvailability = (id: number, currentAvailable: boolean) => {
    updateMutation.mutate({ id, data: { isAvailable: !currentAvailable } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
        toast({ title: "Availability updated" });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Management</h1>
          <p className="text-muted-foreground mt-1">Manage your fleet inventory</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by make, model..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Vehicle</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Vehicle</DialogTitle>
              </DialogHeader>
              <VehicleForm 
                onSubmit={(data) => {
                  createMutation.mutate({ data }, {
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
                      toast({ title: "Vehicle added" });
                      setIsAddOpen(false);
                    }
                  });
                }} 
                isPending={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-muted-foreground bg-muted/20">
                  <th className="py-3 px-4 font-medium">Vehicle</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">License Plate</th>
                  <th className="py-3 px-4 font-medium">Daily Rate</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="py-8 text-center">Loading...</td></tr>
                ) : !vehicles?.length ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No vehicles found.</td></tr>
                ) : vehicles.map(v => (
                  <tr key={v.id} className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-16 bg-muted rounded overflow-hidden flex items-center justify-center shrink-0">
                          {v.imageUrl ? <img src={v.imageUrl} className="object-cover w-full h-full" alt="" /> : <Car className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div>
                          <p className="font-semibold">{v.make} {v.model}</p>
                          <p className="text-xs text-muted-foreground">{v.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><Badge variant="outline">{v.category}</Badge></td>
                    <td className="py-3 px-4 font-mono">{v.licensePlate}</td>
                    <td className="py-3 px-4 font-medium">${v.dailyRate}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={v.isAvailable} 
                          onCheckedChange={() => handleToggleAvailability(v.id, v.isAvailable)} 
                        />
                        <span className="text-xs font-medium">{v.isAvailable ? "Available" : "Unavailable"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingVehicle(v)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(v.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingVehicle} onOpenChange={(o) => !o && setEditingVehicle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>
          {editingVehicle && (
            <VehicleForm 
              defaultValues={editingVehicle}
              onSubmit={(data) => {
                updateMutation.mutate({ id: editingVehicle.id, data }, {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
                    toast({ title: "Vehicle updated" });
                    setEditingVehicle(null);
                  }
                });
              }} 
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VehicleForm({ onSubmit, defaultValues = {}, isPending }: any) {
  const [formData, setFormData] = useState({
    make: defaultValues.make || "",
    model: defaultValues.model || "",
    year: defaultValues.year || new Date().getFullYear(),
    category: defaultValues.category || "Sedan",
    dailyRate: defaultValues.dailyRate || 50,
    seats: defaultValues.seats || 5,
    transmission: defaultValues.transmission || "Automatic",
    fuelType: defaultValues.fuelType || "Petrol",
    licensePlate: defaultValues.licensePlate || "",
    imageUrl: defaultValues.imageUrl || "",
    description: defaultValues.description || "",
  });

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: id === 'year' || id === 'dailyRate' || id === 'seats' ? Number(value) : value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="make">Make</Label>
          <Input id="make" required value={formData.make} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" required value={formData.model} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input id="year" type="number" required value={formData.year} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="licensePlate">License Plate</Label>
          <Input id="licensePlate" required value={formData.licensePlate} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(v) => handleSelectChange('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.values(VehicleCategory).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dailyRate">Daily Rate ($)</Label>
          <Input id="dailyRate" type="number" required value={formData.dailyRate} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seats">Seats</Label>
          <Input id="seats" type="number" required value={formData.seats} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="transmission">Transmission</Label>
          <Select value={formData.transmission} onValueChange={(v) => handleSelectChange('transmission', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.values(VehicleTransmission).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuelType">Fuel Type</Label>
          <Input id="fuelType" required value={formData.fuelType} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input id="imageUrl" value={formData.imageUrl} onChange={handleChange} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" value={formData.description} onChange={handleChange} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Vehicle"}</Button>
      </DialogFooter>
    </form>
  );
}
// Stub for the missing import
function Car(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>; }