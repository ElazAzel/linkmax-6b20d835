
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Check from 'lucide-react/dist/esm/icons/check';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface InviteData {
    id: string;
    zone_id: string;
    email: string;
    role: string;
    status: string;
    expires_at: string;
    zones: {
        name: string;
        logo_url: string | null;
    };
}

async function fetchInvite(token: string): Promise<InviteData | null> {
    const { data, error } = await supabase.rpc('get_zone_invite_by_token' as any, { p_token: token });

    if (error || !data) return null;
    return data as any;
}

export default function AcceptInvite() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id || null);
        });
    }, []);

    const { data: invite, isLoading, error } = useQuery({
        queryKey: ['zone-invite', token],
        queryFn: () => fetchInvite(token!),
        enabled: !!token,
    });

    const acceptMutation = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.rpc('accept_zone_invite' as any, { p_token: token });
            if (error) throw error;
            const result = data as any;
            if (!result.success) throw new Error(result.error);
            return result;
        },
        onSuccess: (data) => {
            toast.success(t('zones.invites.accepted', 'Welcome to the zone!'));
            navigate('/dashboard/zone-dashboard');
        },
        onError: (err: any) => {
            toast.error(err.message || t('common.error', 'Failed to accept invite'));
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                <div className="max-w-md w-full space-y-4">
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !invite) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <Card className="p-8 text-center max-w-md bg-card/60 backdrop-blur-xl border-border/30 rounded-2xl">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold mb-2">{t('zones.invites.invalid', 'Invitation invalid')}</h1>
                    <p className="text-muted-foreground mb-6">
                        {t('zones.invites.invalidDesc', 'This invitation link is invalid, expired, or has already been used.')}
                    </p>
                    <Link to="/">
                        <Button variant="outline" className="rounded-xl">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t('common.toHome', 'Go Home')}
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <Card className="p-8 text-center max-w-md w-full bg-card/60 backdrop-blur-xl border-border/30 rounded-2xl border-t-4 border-t-primary">
                <div className="mb-6">
                    <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-background shadow-xl mb-4">
                        <ShieldCheck className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold mb-1">{t('zones.invites.title', 'Join Workspace')}</h1>
                    <p className="text-sm text-muted-foreground">{invite.zones.name}</p>
                </div>

                <div className="bg-muted/30 p-4 rounded-xl mb-6 text-left border border-border/20">
                    <p className="text-sm font-medium mb-1">{t('zones.invites.roleLabel', 'Role')}:</p>
                    <Badge variant="secondary" className="capitalize">
                        {invite.role}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-3">
                        {t('zones.invites.emailNotice', 'Accepting as')}: <span className="font-medium text-foreground">{invite.email}</span>
                    </p>
                </div>

                {!userId ? (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            {t('zones.invites.loginRequired', 'Please sign in to accept this invitation')}
                        </p>
                        <Link to={`/auth?redirect=/invites/${token}`}>
                            <Button className="w-full h-11 rounded-xl font-medium">
                                {t('auth.login', 'Sign In')}
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <Button
                        className="w-full h-11 rounded-xl font-medium shadow-lg shadow-primary/20"
                        onClick={() => acceptMutation.mutate()}
                        disabled={acceptMutation.isPending}
                    >
                        {acceptMutation.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                            <Check className="h-5 w-5 mr-2" />
                        )}
                        {t('zones.invites.join', 'Accept & Join')}
                    </Button>
                )}

                <Link to="/" className="block mt-6">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('common.toHome', 'Back to Home')}
                    </Button>
                </Link>
            </Card>
        </div>
    );
}
