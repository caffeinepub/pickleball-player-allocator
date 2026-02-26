import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSaveCallerUserProfile, useGetCallerUserProfile } from "@/hooks/useQueries";
import { Loader2, User, Phone, Briefcase, Camera, Star } from "lucide-react";
import { savePlayerProfile } from "@/lib/storage";

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

// Initial rating for new players: mu=1500, sigma=350, rating = 1500 - 2*350 = 800
const INITIAL_RATING = 800;

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { data: existingProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [mobileNumber, setMobileNumber] = useState("");
  const [bio, setBio] = useState("");
  const [workField, setWorkField] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!mobileNumber.trim()) newErrors.mobileNumber = "Mobile number is required";
    else if (!/^\d{6,15}$/.test(mobileNumber.replace(/\s/g, ""))) {
      newErrors.mobileNumber = "Enter a valid mobile number (digits only)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicture(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const fullMobile = `${countryCode}${mobileNumber.replace(/\s/g, "")}`;

    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        mobileNumber: fullMobile,
        bio: bio.trim() || undefined,
        profilePicture: profilePicture || undefined,
        workField: workField.trim() || undefined,
      });

      // principalId is optional in StoredPlayerProfile
      savePlayerProfile({
        name: name.trim(),
        mobileNumber: fullMobile,
        bio: bio.trim() || undefined,
        profilePicture: profilePicture || undefined,
        workField: workField.trim() || undefined,
      });

      navigate({ to: "/" });
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Set Up Your Profile</CardTitle>
          <CardDescription>
            Tell us about yourself to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <label className="cursor-pointer">
                <span className="text-xs text-primary font-medium hover:underline">
                  Upload photo (optional)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <Label htmlFor="mobile" className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Mobile Number <span className="text-destructive">*</span>
              </Label>
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
                  id="mobile"
                  value={mobileNumber}
                  onChange={(e) =>
                    setMobileNumber(e.target.value.replace(/[^\d\s]/g, ""))
                  }
                  placeholder="Phone number"
                  className={`flex-1 ${errors.mobileNumber ? "border-destructive" : ""}`}
                />
              </div>
              {errors.mobileNumber && (
                <p className="text-xs text-destructive">{errors.mobileNumber}</p>
              )}
            </div>

            {/* Work Field */}
            <div className="space-y-1.5">
              <Label htmlFor="workField" className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                Work Field <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Input
                id="workField"
                value={workField}
                onChange={(e) => setWorkField(e.target.value)}
                placeholder="e.g. Software Engineer, Teacher..."
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="bio">
                Bio <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell other players about yourself..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Rating Preview */}
            <div className="bg-muted/40 rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Starting Rating</p>
                <p className="text-sm font-bold text-foreground">{INITIAL_RATING}</p>
              </div>
              <Badge variant="secondary" className="text-xs">Hybrid TrueSkill-Elo</Badge>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={saveProfile.isPending}
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Create Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
