import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { 
  UploadCloud, 
  ArrowLeft, 
  RefreshCcw, 
  SendHorizontal,
  MapPin,
  Calendar,
  Clock,
  Info,
  Camera,
  PawPrint,
  Heart,
  Loader2
} from "lucide-react";
import heroPets from "@/assets/design/hero-pets.svg";
import heroPetsDrk from "@/assets/design/hero-pets-drk.svg";
import { useTheme } from "@/components/providers/theme-provider";
import { getApiUrl } from "@/lib/api";

export default function ReportPet() {
  const { type } = useParams<{ type: "lost" | "found" }>();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const navigate = useNavigate();
  const isLost = type === "lost";
  
  const accentColor = isLost ? "text-red-500" : "text-green-500";
  const bgColor = isLost ? "bg-red-50/50 dark:bg-red-900/10" : "bg-green-50/50 dark:bg-green-900/10";
  const borderColor = isLost ? "border-red-100 dark:border-red-900/20" : "border-green-100 dark:border-green-900/20";
  const btnColor = isLost ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600";
  
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const heroImg = isDarkMode ? heroPetsDrk : heroPets;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    petName: "",
    species: "",
    breed: "",
    gender: "unknown",
    age: "adult",
    color: "",
    marks: "",
    location: "",
    date: new Date().toISOString().split('T')[0],
    time: "12:00",
    description: "",
    reward: 0,
    condition: "Good"
  });

  const [photos, setPhotos] = useState<string[]>([]);

  // Load data if editing
  React.useEffect(() => {
    if (editId) {
      const fetchCaseData = async () => {
        setIsFetching(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(getApiUrl(`/api/cases/${editId}`), {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            console.log("Loaded case data for edit:", data);
            const reportDate = new Date(data.report_date);
            const loadedGender = String(data.gender || "unknown").toLowerCase();
            const validGenders = ["male", "female", "unknown"];
            
            setFormData({
              petName: data.name || "",
              species: data.species || "",
              breed: data.breed || "",
              gender: validGenders.includes(loadedGender) ? loadedGender : "unknown",
              age: String(data.age || "adult").toLowerCase(),
              color: data.color || "",
              marks: data.distinguishing_marks || "",
              location: data.city || "",
              date: reportDate.toISOString().split('T')[0],
              time: reportDate.toISOString().split('T')[1].slice(0, 5),
              description: data.description || "",
              reward: data.reward || 0,
              condition: data.found_condition || "Good"
            });
            setPhotos(data.photos || []);
          } else {
            setError(data.error || "Failed to load case data");
          }
        } catch (err) {
          console.error("Error fetching case for edit:", err);
          setError("Failed to connect to server");
        } finally {
          setIsFetching(false);
        }
      };
      fetchCaseData();
    }
  }, [editId]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async () => {
    if (!formData.species || !formData.breed || !formData.location || !formData.color) {
      setError("Please fill in all required fields (marked with *)");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in to submit a report.");

      const response = await fetch(getApiUrl(editId ? `/api/cases/${editId}` : "/api/cases"), {
        method: editId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          type: type, // 'lost' or 'found'
          photos: photos // Array of base64 strings
        })
      });

      // Handle potential non-JSON responses
      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${response.status}. ${text.slice(0, 100)}`);
      }

      if (!response.ok) throw new Error(data.error || "Failed to submit report");

      setSuccess(true);
      setTimeout(() => navigate("/app/dashboard"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-green-500 animate-bounce">
          <Heart className="w-12 h-12 fill-current" />
        </div>
        <h2 className="text-3xl font-bold">Report {editId ? 'Updated' : 'Submitted'}!</h2>
        <p className="text-gray-500 max-w-md">Your report has been successfully {editId ? 'updated' : 'recorded'}.</p>
        <p className="text-sm text-gray-400 italic">Redirecting to dashboard...</p>
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Loading Report Data...</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait while we retrieve your post details.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] relative overflow-hidden pb-12">
      {/* Decorative Background Blobs */}
      <div className={`absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none ${isLost ? 'bg-red-400' : 'bg-green-400'}`} />
      <div className={`absolute bottom-[10%] left-[-5%] w-[300px] h-[300px] rounded-full blur-[100px] opacity-10 pointer-events-none ${isLost ? 'bg-orange-400' : 'bg-teal-400'}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Navigation & Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-4">
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/app/dashboard')} 
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white -ml-4 h-9 px-4 rounded-full hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                {editId ? 'Edit' : 'Report'} {isLost ? 'Lost' : 'Found'} <span className={accentColor}>Pet</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                {editId ? "Update your report details below." : (isLost 
                  ? "Let's help you bring your furry friend back home safely." 
                  : "Thank you for helping a pet find its way back to its family.")}
              </p>
            </div>
          </div>
          
          <div className="hidden lg:block w-64 h-auto">
            <img src={heroImg} className="w-full h-auto opacity-90 transform translate-y-4 transition-all duration-500" alt="Hero Pets" />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center gap-3 font-bold">
            <Info className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Section */}
          <div className="lg:col-span-8 space-y-8">
            {/* Step 1: Pet Details */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-[#1A2234]/80 backdrop-blur-xl rounded-2xl overflow-hidden">
              <div className={`h-1.5 w-full ${isLost ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                <div className={`h-full w-1/3 ${isLost ? 'bg-red-500' : 'bg-green-500'}`} />
              </div>
              <CardContent className="p-8 sm:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className={`p-2 rounded-xl ${bgColor} ${accentColor}`}>
                    <PawPrint className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pet Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="petName" className="text-gray-700 dark:text-gray-300 font-semibold px-1">Pet Name {isLost && <span className="text-red-500">*</span>}</Label>
                    <Input 
                      id="petName" 
                      placeholder={isLost ? "e.g. Bruno" : "Unknown (or temporary name)"} 
                      value={formData.petName}
                      onChange={(e) => setFormData({...formData, petName: e.target.value})}
                      className="h-12 bg-gray-50/50 dark:bg-[#151a25]/50 border-gray-100 dark:border-gray-800 rounded-2xl px-5 focus:ring-2 focus:ring-opacity-20 focus:ring-current transition-all" 
                    />
                  </div>
                  
                  <div className="space-y-2.5">
                    <Label htmlFor="species" className="text-gray-700 dark:text-gray-300 font-semibold px-1">Species <span className="text-red-500">*</span></Label>
                    <Select onValueChange={(val) => setFormData({...formData, species: val})} value={formData.species}>
                      <SelectTrigger id="species" className="h-12 bg-gray-50/50 dark:bg-[#151a25]/50 border-gray-100 dark:border-gray-800 rounded-2xl px-5">
                        <SelectValue placeholder="Select Species" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-xl">
                        <SelectItem value="dog">Dog</SelectItem>
                        <SelectItem value="cat">Cat</SelectItem>
                        <SelectItem value="bird">Bird</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="breed" className="text-gray-700 dark:text-gray-300 font-semibold px-1">Breed / Description <span className="text-red-500">*</span></Label>
                    <Input 
                      id="breed" 
                      placeholder="e.g. Golden Retriever or Mixed Breed" 
                      value={formData.breed}
                      onChange={(e) => setFormData({...formData, breed: e.target.value})}
                      className="h-12 bg-gray-50/50 dark:bg-[#151a25]/50 border-gray-100 dark:border-gray-800 rounded-2xl px-5" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <div className="space-y-2.5">
                      <Label htmlFor="gender" className="text-gray-700 dark:text-gray-300 font-semibold px-1">Gender</Label>
                      <Select onValueChange={(val) => setFormData({...formData, gender: val})} value={formData.gender}>
                        <SelectTrigger className="h-12 bg-gray-50/50 dark:bg-[#151a25]/50 border-gray-100 dark:border-gray-800 rounded-2xl px-5">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-xl">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="age" className="text-gray-700 dark:text-gray-300 font-semibold px-1">Age</Label>
                      <Select onValueChange={(val) => setFormData({...formData, age: val})} value={formData.age}>
                        <SelectTrigger className="h-12 bg-gray-50/50 dark:bg-[#151a25]/50 border-gray-100 dark:border-gray-800 rounded-2xl px-5">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-xl">
                          <SelectItem value="puppy">Puppy / Kitten</SelectItem>
                          <SelectItem value="young">Young adult</SelectItem>
                          <SelectItem value="adult">Adult</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="color" className="text-gray-700 dark:text-gray-300 font-semibold px-1">Primary Color(s) <span className="text-red-500">*</span></Label>
                    <Input 
                      id="color" 
                      placeholder="e.g. Golden / White with Brown patches" 
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="h-12 bg-gray-50/50 dark:bg-[#151a25]/50 border-gray-100 dark:border-gray-800 rounded-2xl px-5" 
                    />
                  </div>

                  <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="marks" className="text-gray-700 dark:text-gray-300 font-semibold px-1">Distinctive Marks / Features</Label>
                    <Textarea 
                      id="marks" 
                      placeholder="e.g. White spot on chest, wearing a red collar..." 
                      value={formData.marks}
                      onChange={(e) => setFormData({...formData, marks: e.target.value})}
                      className="min-h-[100px] bg-gray-50/50 dark:bg-[#151a25]/50 border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 resize-none" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Location & Time */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-[#1A2234]/80 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardContent className="p-8 sm:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className={`p-2 rounded-xl ${bgColor} ${accentColor}`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Last Seen Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                   <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="location" className="text-gray-700 dark:text-gray-300 font-semibold px-1">Location / Area <span className="text-red-500">*</span></Label>
                    <div className="relative group">
                      <Input 
                        id="location" 
                        placeholder="e.g. Dhanmondi Lake, near Sector 5" 
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="h-12 bg-gray-50/50 dark:bg-[#151a25]/50 border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-5 transition-all" 
                      />
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-current transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="date" className="text-gray-700 dark:text-gray-300 font-semibold px-1">Date <span className="text-red-500">*</span></Label>
                    <div className="relative group">
                      <Input 
                        id="date" 
                        type="date" 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="h-12 bg-gray-50/50 dark:bg-[#151a25]/50 border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-5" 
                      />
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="time" className="text-gray-700 dark:text-gray-300 font-semibold px-1">Time</Label>
                    <div className="relative group">
                      <Input 
                        id="time" 
                        type="time" 
                        value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                        className="h-12 bg-gray-50/50 dark:bg-[#151a25]/50 border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-5" 
                      />
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="additional" className="text-gray-700 dark:text-gray-300 font-semibold px-1">{isLost ? 'Reward (if any)' : 'Found Condition'}</Label>
                    {isLost ? (
                      <Input 
                        type="number" 
                        placeholder="e.g. 5000" 
                        value={formData.reward}
                        onChange={(e) => setFormData({...formData, reward: Number(e.target.value)})}
                        className="h-12 bg-gray-50/50 dark:bg-[#151a25]/50 border-gray-100 dark:border-gray-800 rounded-2xl px-5" 
                      />
                    ) : (
                      <Input 
                        placeholder="e.g. Hungry but healthy" 
                        value={formData.condition}
                        onChange={(e) => setFormData({...formData, condition: e.target.value})}
                        className="h-12 bg-gray-50/50 dark:bg-[#151a25]/50 border-gray-100 dark:border-gray-800 rounded-2xl px-5" 
                      />
                    )}
                  </div>

                  <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="description" className="text-gray-700 dark:text-gray-300 font-semibold px-1">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe the circumstances or any other helpful info..." 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="min-h-[120px] bg-gray-50/50 dark:bg-[#151a25]/50 border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 resize-none" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar / Upload Section */}
          <div className="lg:col-span-4 space-y-8 sticky top-28">
            <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-[#1A2234]/80 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-xl ${bgColor} ${accentColor}`}>
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Photo Evidence</h3>
                    <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Multiple photos encouraged</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div 
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className={`border-2 border-dashed ${borderColor} rounded-3xl p-6 flex flex-col items-center justify-center text-center ${bgColor} cursor-pointer hover:border-opacity-50 transition-all group min-h-[160px]`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 duration-300 ${isLost ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-green-100 dark:bg-green-900/30 text-green-500'}`}>
                       <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Click to Upload Photos</p>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[11px] text-gray-500 leading-relaxed font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md uppercase tracking-tighter">Multi-photo Support</p>
                      <p className="text-[10px] text-gray-400 leading-relaxed font-medium">Select up to 10 photos of the pet</p>
                    </div>
                    <input 
                      id="photo-upload" 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoUpload} 
                    />
                  </div>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {photos.map((photo, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                          <img src={photo} className="w-full h-full object-cover" alt="Preview" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                            className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <div 
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 hover:text-green-500 hover:border-green-200 dark:hover:border-green-900/50 transition-all cursor-pointer bg-gray-50/30 dark:bg-slate-800/20"
                      >
                        <span className="text-xl font-light">+</span>
                        <span className="text-[8px] font-bold uppercase">Add More</span>
                      </div>
                    </div>
                  )}
                  {photos.length > 0 && (
                    <p className="text-[10px] font-bold text-center text-green-500 uppercase tracking-widest bg-green-50 dark:bg-green-900/20 py-1 rounded-lg">
                      {photos.length} {photos.length === 1 ? 'photo' : 'photos'} selected
                    </p>
                  )}
                </div>

                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                      High quality photos increase recovery chances by up to <span className="font-bold text-gray-900 dark:text-white">80%</span>.
                    </p>
                  </div>
                  
                  <div className="pt-2 space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Tips</h4>
                    <ul className="space-y-3">
                      {['Clear facial features', 'Visible unique marks', 'Good natural lighting'].map((tip, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-[13px] text-gray-600 dark:text-gray-400 font-medium">
                          <div className={`w-1.5 h-1.5 rounded-full ${isLost ? 'bg-red-400' : 'bg-green-400'}`} />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              <Button 
                className={`h-14 rounded-2xl ${btnColor} text-white font-bold text-lg shadow-lg shadow-current/20 transition-all active:scale-[0.98] group`}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {editId ? 'Updating...' : 'Submitting...'}</> : <>{editId ? 'Update Report' : 'Submit Report'} <SendHorizontal className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>}
              </Button>
              <Button 
                onClick={() => {
                  setFormData({
                    petName: "", species: "", breed: "", gender: "unknown", age: "adult", color: "", marks: "", location: "", date: new Date().toISOString().split('T')[0], time: "12:00", description: "", reward: 0, condition: "Good"
                  });
                  setPhotos([]);
                }}
                className="h-12 rounded-2xl text-gray-500 dark:text-gray-400 font-bold hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                <RefreshCcw className="w-4 h-4 mr-2" /> Reset Form
              </Button>
            </div>

            {/* Support Message */}
            <div className="text-center px-4">
              <p className="text-[12px] text-gray-400 font-medium leading-relaxed">
                By submitting, you agree to our terms. We'll start matching your report immediately.
                <Heart className="w-3 h-3 inline-block ml-1 text-red-400 fill-current animate-pulse" />
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
