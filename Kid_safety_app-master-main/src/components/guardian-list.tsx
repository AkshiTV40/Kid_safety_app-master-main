'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const guardianSchema = z.object({
  id: z.string(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone number format." }),
});

const addGuardianSchema = guardianSchema.omit({ id: true });

type Guardian = z.infer<typeof guardianSchema>;

export default function GuardianList() {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof addGuardianSchema>>({
    resolver: zodResolver(addGuardianSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  useEffect(() => {
    setIsClient(true);
    try {
      const storedGuardians = localStorage.getItem('guardians');
      if (storedGuardians) {
        setGuardians(JSON.parse(storedGuardians));
      }
    } catch (error) {
      console.error("Failed to parse guardians from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('guardians', JSON.stringify(guardians));
      // Dispatch a storage event to notify other components like GuardianKeychain
      window.dispatchEvent(new Event('storage'));
    }
  }, [guardians, isClient]);

  const onSubmit = (values: z.infer<typeof addGuardianSchema>) => {
    const newGuardian: Guardian = {
      id: new Date().toISOString(),
      ...values,
    };
    setGuardians(prev => [...prev, newGuardian]);
    form.reset();
    toast({
      title: "Guardian Added",
      description: `${values.name} is now a guardian.`,
    });
  };

  const deleteGuardian = (id: string) => {
    const guardianToDelete = guardians.find(g => g.id === id);
    setGuardians(prev => prev.filter(g => g.id !== id));
    toast({
        title: "Guardian Removed",
        description: `${guardianToDelete?.name} is no longer a guardian.`,
        variant: "destructive"
    });
  };

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add a New Guardian</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., +1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Guardian
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Guardians</CardTitle>
        </CardHeader>
        <CardContent>
          {guardians.length > 0 ? (
            <ul className="space-y-4">
              {guardians.map(guardian => (
                <li key={guardian.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>{guardian.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{guardian.name}</p>
                      <p className="text-sm text-muted-foreground">{guardian.phone}</p>
                    </div>
                  </div>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete {guardian.name}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove <strong>{guardian.name}</strong> from your guardians list.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Button variant="destructive" onClick={() => deleteGuardian(guardian.id)}>
                              Delete
                            </Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <User className="mx-auto h-12 w-12" />
              <p className="mt-2">You haven't added any guardians yet.</p>
              <p className="text-sm">Use the form to add your first one.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
