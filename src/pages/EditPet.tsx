import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { 
  ChevronLeft, 
  Camera, 
  Upload, 
  X, 
  Info,
  Heart,
  ShieldCheck,
  Edit2,
  Loader2
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

export default function EditPet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "",
    age: "",
    color: "",
    distinguishing_marks: ""
  });

  useEffect(() => {
    const fetchPetData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl(`/api/my-pets/${id}`), {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name || "",
            species: (data.species || "").toLowerCase(),
            breed: data.breed || "",
            gender: (data.gender || "").toLowerCase(),
            age: data.age || "",
            color: data.color || "",
            distinguishing_marks: data.distinguishing_marks || ""
          });
          if (data.photos) {
            setPhotos(data.photos);
          } else if (data.photo_url) {
            setPhotos([data.photo_url]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch pet data", err);
      } finally {
        setFetching(false);
      }
    };

    fetchPetData();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = Array.from(files);
      newPhotos.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`/api/my-pets/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          images: photos
        })
      });

      if (res.ok) {
        navigate(`/app/my-pets/${id}`);
      }
    } catch (err) {
      console.error("Failed to update pet", err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Loading Pet Data...</h2>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div className="space-y-1">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-rose-500 transition-colors mb-2 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Profile
          </button>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Edit2 className="w-8 h-8 text-rose-500" />
            Edit {formData.name}'s Profile
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Update your pet's information to keep it accurate.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            type="button"
            variant="outline" 
            className="h-11 px-6 rounded-xl border-gray-200 dark:border-gray-800 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={loading}
            className="h-11 px-8 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 transition-all active:scale-95"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Update Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Identity Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/20 flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-rose-500">
                 <Info className="w-5 h-5" />
               </div>
               <h2 className="font-bold text-lg text-gray-900 dark:text-white">Basic Information</h2>
            </div>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">Pet Name</Label>
                <Input 
                  placeholder="e.g. Charlie" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12 rounded-xl bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-gray-800 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">Species</Label>
                <Select value={formData.species} onValueChange={(v) => setFormData({ ...formData, species: v })}>
                  <SelectTrigger className="h-12 rounded-xl bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-gray-800 font-medium">
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="cat">Cat</SelectItem>
                    <SelectItem value="bird">Bird</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">Breed</Label>
                <Input 
                  placeholder="e.g. Golden Retriever" 
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  className="h-12 rounded-xl bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-gray-800 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger className="h-12 rounded-xl bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-gray-800 font-medium">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">Age Range</Label>
                <Select value={formData.age} onValueChange={(v) => setFormData({ ...formData, age: v })}>
                  <SelectTrigger className="h-12 rounded-xl bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-gray-800 font-medium">
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                    <SelectItem value="Baby">Baby (0-1 year)</SelectItem>
                    <SelectItem value="Young">Young (1-3 years)</SelectItem>
                    <SelectItem value="Adult">Adult (3-8 years)</SelectItem>
                    <SelectItem value="Senior">Senior (8+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">Color</Label>
                <Input 
                  placeholder="e.g. Golden Brown" 
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-12 rounded-xl bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-gray-800 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">Distinctive Marks</Label>
                <Textarea 
                  placeholder="Describe unique features like spots, collars, or medical conditions..." 
                  value={formData.distinguishing_marks}
                  onChange={(e) => setFormData({ ...formData, distinguishing_marks: e.target.value })}
                  className="min-h-[120px] rounded-xl bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-gray-800 focus:ring-rose-500/20 focus:border-rose-500 font-medium resize-none p-4"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Photo Upload + Security Tips */}
        <div className="space-y-8">
          <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden">
             <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center text-purple-500">
                  <Camera className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">Pet Photo</h2>
             </div>
             <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 dark:border-gray-800 shadow-sm">
                      <img src={photo} className="w-full h-full object-cover" alt={`Preview ${index}`} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Button 
                           type="button"
                           size="sm" 
                           variant="destructive" 
                           className="rounded-xl font-bold h-8 w-8 p-0"
                           onClick={() => removePhoto(index)}
                         >
                           <X className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
                  ))}
                  
                  {photos.length < 6 && (
                    <div className="relative aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-rose-300 dark:hover:border-rose-800 transition-all flex flex-col items-center justify-center gap-2 bg-gray-50/50 dark:bg-slate-900/30 group cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-gray-400 group-hover:text-rose-500 transition-colors shadow-sm">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Add Photo</span>
                      <input 
                        type="file" 
                        multiple
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={handleImageChange}
                        accept="image/*"
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 space-y-2">
                   <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                      <Camera className="w-4 h-4" />
                      Pro Tip
                   </div>
                   <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-400 font-medium">
                     Clear, front-facing photos help our AI better match your pet in case they ever get lost.
                   </p>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="pt-4 flex justify-end gap-4 border-t border-gray-100 dark:border-gray-800">
        <Button 
          type="button"
          variant="outline" 
          className="h-12 px-8 rounded-xl border-gray-200 dark:border-gray-800 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
          onClick={() => navigate(-1)}
        >
          Discard Changes
        </Button>
        <Button 
          type="submit"
          disabled={loading}
          className="h-12 px-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-xl shadow-rose-500/20 hover:shadow-rose-500/30 transition-all active:scale-95"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Update Profile
        </Button>
      </div>
    </form>
  );
}
