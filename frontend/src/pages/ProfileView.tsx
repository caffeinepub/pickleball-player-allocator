import React, { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Save, X, Star } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { getPlayerProfile, setPlayerProfile } from '@/lib/storage';
import { formatDuprRating } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function ProfileView() {
  const router = useRouter();
  const profile = getPlayerProfile();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.name ?? '');
  const [editDupr, setEditDupr] = useState(
    profile?.duprRating != null ? String(profile.duprRating) : ''
  );

  if (!profile) {
    router.navigate({ to: '/profile/setup' });
    return null;
  }

  const handleSave = () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    const parsedRating = editDupr ? parseFloat(editDupr) : undefined;
    if (parsedRating !== undefined && (isNaN(parsedRating) || parsedRating < 2.0 || parsedRating > 8.0)) {
      toast.error('DUPR rating must be between 2.00 and 8.00');
      return;
    }
    setPlayerProfile({ name: editName.trim(), duprRating: parsedRating });
    setEditing(false);
    toast.success('Profile updated!');
  };

  const handleCancel = () => {
    setEditName(profile.name);
    setEditDupr(profile.duprRating != null ? String(profile.duprRating) : '');
    setEditing(false);
  };

  return (
    <Layout
      title="My Profile"
      showBack
      backTo="/"
      headerRight={
        !editing ? (
          <Button variant="ghost" size="icon" onClick={() => setEditing(true)} className="btn-touch">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4 animate-slide-up">
        {/* Avatar */}
        <div className="flex justify-center pt-2">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-card">
            <span className="font-display font-black text-3xl text-primary-foreground">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Name */}
        <Card className="border border-border shadow-card">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-display">Name</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            {editing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={30}
                autoFocus
              />
            ) : (
              <p className="text-base font-semibold text-foreground">{profile.name}</p>
            )}
          </CardContent>
        </Card>

        {/* DUPR Rating */}
        <Card className="border border-border shadow-card">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              DUPR Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            {editing ? (
              <Input
                type="number"
                placeholder="e.g. 3.50"
                value={editDupr}
                onChange={(e) => setEditDupr(e.target.value)}
                min={2.0}
                max={8.0}
                step={0.01}
              />
            ) : (
              <Badge variant="secondary" className="text-sm">
                {formatDuprRating(profile.duprRating ?? null)}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Edit actions */}
        {editing && (
          <div className="flex gap-3">
            <Button
              className="flex-1 btn-touch gradient-primary text-primary-foreground font-semibold"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>
            <Button
              variant="outline"
              className="flex-1 btn-touch"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
