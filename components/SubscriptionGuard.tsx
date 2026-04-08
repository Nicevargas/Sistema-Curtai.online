'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, CreditCard, ExternalLink, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const [profile, setProfile] = useState<any>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    async function checkSubscription() {
      // Don't block login or register pages
      if (pathname === '/login' || pathname === '/cadastro') {
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch profile to check role and payment status
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile in SubscriptionGuard:', profileError);
        }

        setProfile(profileData);

        // Admins and Admin Masters are never blocked
        const role = (profileData?.role || '').toLowerCase();
        const userEmail = user.email?.toLowerCase() || '';
        const isSuperAdmin = userEmail === 'eunicelvargas@gmail.com';
        const isAdmin = role === 'admin' || role === 'admin master' || role === 'admim master' || isSuperAdmin;
        
        console.log('SubscriptionGuard Check:', {
          email: userEmail,
          role: role,
          isSuperAdmin,
          isAdmin,
          plan: profileData?.plan,
          status: profileData?.status,
          is_paid: profileData?.is_paid
        });

        if (isAdmin || profileData?.plan === 'no_charge') {
          console.log('User is admin or super admin, allowing access.');
          setIsBlocked(false);
          setLoading(false);
          return;
        }

        // If user is already marked as paid, don't block
        if (profileData?.status === 'Pago' || profileData?.is_paid === true) {
          console.log('User has paid status, allowing access.');
          setIsBlocked(false);
          setLoading(false);
          return;
        }

        const createdAt = new Date(user.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Determine trial days based on plan
        const trialDays = profileData?.plan === '30_days_free' ? 30 : 7;
        const remaining = trialDays - Math.floor(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(remaining > 0 ? remaining : 0);

        if (diffDays > trialDays) {
          console.log(`User trial expired (${diffDays} > ${trialDays}). Blocking.`);
          setIsBlocked(true);
        } else {
          console.log(`User within trial period (${diffDays} <= ${trialDays}). Allowing access.`);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      const response = await fetch('/api/checkout', {
        method: 'POST',
      });
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse checkout response:', e);
        data = { error: 'Erro ao processar resposta do servidor.' };
      }
      
      if (response.ok && data.init_point) {
        window.location.href = data.init_point;
      } else {
        console.error('Failed to get checkout URL:', data);
        const errorMsg = data.error || data.details || 'Erro ao iniciar o pagamento.';
        alert(`${errorMsg} Tente novamente mais tarde.`);
      }
    } catch (error: any) {
      console.error('Error initiating checkout:', error);
      alert(`Erro ao iniciar o pagamento: ${error.message || 'Verifique sua conexão.'}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-primary/5 blur-[120px] rounded-full -z-10" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 backdrop-blur-xl text-center shadow-2xl"
        >
          <div className="mb-8 flex justify-center">
            <div className="relative size-48">
              <Image 
                src="https://curtai.online/logoCurtai.png" 
                alt="Mistika Logo" 
                fill 
                className="object-contain"
                priority
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="size-8 text-primary" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-display">Seu período de teste expirou</h2>
          <p className="text-slate-600 mb-8">
            Seu curso místico de {daysRemaining === 0 ? (profile?.plan === '30_days_free' ? 30 : 7) : ''} dias chegou ao fim. Para continuar acessando todos os conteúdos e ferramentas, realize o pagamento da sua assinatura.
          </p>

          <div className="space-y-4">
            <button 
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <CreditCard className="size-5" />
              )}
              {checkoutLoading ? 'Iniciando...' : 'Pagar Assinatura'}
              {!checkoutLoading && <ExternalLink className="size-4" />}
            </button>

            <button 
              onClick={handleLogout}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-slate-200"
            >
              <LogOut className="size-5" />
              Sair da conta
            </button>
          </div>

          <p className="mt-8 text-xs text-slate-500">
            Após o pagamento, seu acesso será liberado automaticamente em alguns instantes.
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
