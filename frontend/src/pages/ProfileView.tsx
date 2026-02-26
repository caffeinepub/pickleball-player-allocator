import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "@/hooks/useQueries";
import {
  Loader2,
  User,
  Phone,
  Briefcase,
  Camera,
  Star,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { savePlayerProfile, getPlayerProfile } from "@/lib/storage";
import { formatRating } from "@/lib/utils";

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA" },
  { code: "+44", country: "UK" },
  { code: "+61", country: "AU" },
  { code: "+64", country: "NZ" },
  { code: "+65", country: "SG" },
  { code: "+60", country: "MY" },
  { code: "+63", country: "PH" },
  { code: "+66", country: "TH" },
  { code: "+81", country: "JP" },
  { code: "+82", country: "KR" },
  { code: "+86", country: "CN" },
  { code: "+91", country: "IN" },
  { code: "+49", country: "DE" },
  { code: "+33", country: "FR" },
  { code: "+34", country: "ES" },
  { code: "+39", country: "IT" },
  { code: "+55", country: "BR" },
  { code: "+52", country: "MX" },
  { code: "+27", country: "ZA" },
  { code: "+971", country: "UAE" },
];

export default function ProfileView() {
  const navigate = useNavigate();
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const localProfile = getPlayerProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [mobileNumber, setMobileNumber] = useState("");
  const [bio, setBio] = useState("");
  const [workField, setWorkField] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      const mobile = userProfile.mobileNumber || "";
      const matchedCode = COUNTRY_CODES.find((cc) => mobile.startsWith(cc.code));
      if (matchedCode) {
        setCountryCode(matchedCode.code);
        setMobileNumber(mobile.slice(matchedCode.code.length));
      } else {
        setMobileNumber(mobile);
      }
      setBio(userProfile.bio ?? "");
      setWorkField(userProfile.workField ?? "");
      setProfilePicture(userProfile.profilePicture ?? localProfile?.profilePicture);
    }
  }, [userProfile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicture(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const fullMobile = `${countryCode}${mobileNumber.replace(/\s/g, "")}`;

    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        mobileNumber: fullMobile,
        bio: bio.trim() || undefined,
        profilePicture: profilePicture,
        workField: workField.trim() || undefined,
      });
      // principalId is optional in StoredPlayerProfile
      savePlayerProfile({
        name: name.trim(),
        mobileNumber: fullMobile,
        bio: bio.trim() || undefined,
        profilePicture: profilePicture,
        workField: workField.trim() || undefined,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setName(userProfile.name);
      const mobile = userProfile.mobileNumber || "";
      const matchedCode = COUNTRY_CODES.find((cc) => mobile.startsWith(cc.code));
      if (matchedCode) {
        setCountryCode(matchedCode.code);
        setMobileNumber(mobile.slice(matchedCode.code.length));
      } else {
        setMobileNumber(mobile);
      }
      setBio(userProfile.bio ?? "");
      setWorkField(userProfile.workField ?? "");
      setProfilePicture(userProfile.profilePicture ?? localProfile?.profilePicture);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <p className="text-muted-foreground">No profile found.</p>
        <Button onClick={() => navigate({ to: "/profile/setup" })}>
          Set Up Profile
        </Button>
      </div>
    );
  }

  const displayPicture = profilePicture ?? localProfile?.profilePicture;
  const initials = userProfile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const INITIAL_RATING = 800;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">My Profile</h1>
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={saveProfile.isPending}
              className="gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveProfile.isPending}
              className="gap-1.5"
            >
              {saveProfile.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Avatar */}
      <Card className="shadow-card">
        <CardContent className="pt-6 pb-4 flex flex-col items-center gap-3">
          <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border">
            {displayPicture ? (
              <img
                src={displayPicture}
                alt={userProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-primary">{initials}</span>
            )}
            {isEditing && (
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer rounded-full">
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-foreground">{userProfile.name}</p>
            {userProfile.workField && (
              <p className="text-sm text-muted-foreground">{userProfile.workField}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rating Card */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Rating
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatRating(INITIAL_RATING)}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              Hybrid TrueSkill-Elo
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Your rating is calculated automatically after each match using our proprietary algorithm.
          </p>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
              <User className="w-3 h-3" />
              Full Name
            </Label>
            {isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            ) : (
              <p className="text-sm font-medium text-foreground">{userProfile.name}</p>
            )}
          </div>

          <Separator />

          {/* Mobile */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
              <Phone className="w-3 h-3" />
              Mobile Number
            </Label>
            {isEditing ? (
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring w-24 flex-shrink-0"
                >
                  {COUNTRY_CODES.map((cc) => (
                    <option key={cc.code} value={cc.code}>
                      {cc.code} {cc.country}
                    </option>
                  ))}
                </select>
                <Input
                  value={mobileNumber}
                  onChange={(e) =>
                    setMobileNumber(e.target.value.replace(/[^\d\s]/g, ""))
                  }
                  placeholder="Phone number"
                  className="flex-1"
                />
              </div>
            ) : (
              <p className="text-sm font-medium text-foreground">
                {userProfile.mobileNumber || "—"}
              </p>
            )}
          </div>

          {(userProfile.workField || isEditing) && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
                  <Briefcase className="w-3 h-3" />
                  Work Field
                </Label>
                {isEditing ? (
                  <Input
                    value={workField}
                    onChange={(e) => setWorkField(e.target.value)}
                    placeholder="e.g. Software Engineer, Teacher..."
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {userProfile.workField || "—"}
                  </p>
                )}
              </div>
            </>
          )}

          {(userProfile.bio || isEditing) && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Bio
                </Label>
                {isEditing ? (
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell other players about yourself..."
                    rows={3}
                    className="resize-none"
                  />
                ) : (
                  <p className="text-sm text-foreground">{userProfile.bio || "—"}</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => navigate({ to: "/" })}
      >
        Back to Home
      </Button>
    </div>
  );
}
