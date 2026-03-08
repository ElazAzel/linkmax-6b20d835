/**
 * useRepeatCustomers - Identifies returning customers by phone/email
 * A repeat customer has 2+ bookings with the same phone or email
 */
import { useMemo } from 'react';
import { useAuth } from '@/hooks/user/useAuth';
import { supabase } from '@/platform/supabase/client';
import { useState, useEffect } from 'react';

export interface RepeatCustomer {
  phone?: string;
  email?: string;
  name: string;
  bookingsCount: number;
  lastBookingDate: string;
}

export function useRepeatCustomers() {
  const { user } = useAuth();
  const [repeatPhones, setRepeatPhones] = useState<Set<string>>(new Set());
  const [repeatEmails, setRepeatEmails] = useState<Set<string>>(new Set());
  const [repeatCustomers, setRepeatCustomers] = useState<RepeatCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetch() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('bookings')
          .select('client_name, client_phone, client_email, slot_date, created_at')
          .eq('owner_id', user!.id)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false });

        if (!data) return;

        // Group by phone
        const phoneMap = new Map<string, { count: number; name: string; lastDate: string }>();
        const emailMap = new Map<string, { count: number; name: string; lastDate: string }>();

        for (const b of data) {
          if (b.client_phone) {
            const normalized = b.client_phone.replace(/\D/g, '');
            const existing = phoneMap.get(normalized);
            if (existing) {
              existing.count++;
            } else {
              phoneMap.set(normalized, { count: 1, name: b.client_name, lastDate: b.slot_date });
            }
          }
          if (b.client_email) {
            const normalized = b.client_email.toLowerCase();
            const existing = emailMap.get(normalized);
            if (existing) {
              existing.count++;
            } else {
              emailMap.set(normalized, { count: 1, name: b.client_name, lastDate: b.slot_date });
            }
          }
        }

        const rPhones = new Set<string>();
        const rEmails = new Set<string>();
        const customers: RepeatCustomer[] = [];

        phoneMap.forEach((val, phone) => {
          if (val.count >= 2) {
            rPhones.add(phone);
            customers.push({
              phone,
              name: val.name,
              bookingsCount: val.count,
              lastBookingDate: val.lastDate,
            });
          }
        });

        emailMap.forEach((val, email) => {
          if (val.count >= 2) {
            rEmails.add(email);
            // Avoid duplicates if already added by phone
            if (!customers.some(c => c.name === val.name)) {
              customers.push({
                email,
                name: val.name,
                bookingsCount: val.count,
                lastBookingDate: val.lastDate,
              });
            }
          }
        });

        setRepeatPhones(rPhones);
        setRepeatEmails(rEmails);
        setRepeatCustomers(customers);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, [user]);

  const isRepeatCustomer = useMemo(() => {
    return (phone?: string | null, email?: string | null): boolean => {
      if (phone && repeatPhones.has(phone.replace(/\D/g, ''))) return true;
      if (email && repeatEmails.has(email.toLowerCase())) return true;
      return false;
    };
  }, [repeatPhones, repeatEmails]);

  return { repeatCustomers, isRepeatCustomer, loading, repeatCount: repeatCustomers.length };
}
