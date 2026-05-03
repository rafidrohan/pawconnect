import { useSearchParams, useNavigate } from "react-router-dom";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { AuthModal } from "../components/features/auth/AuthModal";
import heroPets from "@/assets/design/hero-pets.svg";
import heroPetsDark from "@/assets/design/hero-pets-drk.svg";
import stayUpdated from "@/assets/design/stay-updated.svg";
import { 
  Sun, Moon, ShieldCheck, PieChart, Users, Heart, Search, CheckCircle, MapPin, Bell, Star, Mail, ArrowLeft, ArrowRight, User, PawPrint
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Landing() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const authType = searchParams.get("auth");
  const isAuthOpen = !!authType;

  const openAuth = (type: "signin" | "signup") => {
    setSearchParams({ auth: type });
  };

  const closeAuth = () => {
    searchParams.delete("auth");
    setSearchParams(searchParams);
  };

  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1520] font-sans selection:bg-green-200">
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={closeAuth} 
        initialView={(authType as "signin" | "signup") || "signin"} 
      />
      
      {/* Navbar */}
      <nav className="container relative mx-auto px-6 py-4 flex items-center justify-between z-10 max-w-6xl">
        <div className="flex items-center gap-2 font-bold text-2xl text-gray-900 dark:text-white">
          <PawPrint className="w-8 h-8 text-black dark:text-white fill-current" />
          <span className="flex items-center">Paw<span className="text-green-500">Connect</span></span>
        </div>

        <div className="hidden md:flex gap-8 text-sm font-semibold text-gray-600 dark:text-gray-300">
          <a href="/" className="text-green-500 border-b-2 border-green-500 pb-1">Home</a>
          <a href="#about" className="hover:text-green-500 transition-colors">About Us</a>
          <a href="#how-it-works" className="hover:text-green-500 transition-colors">How It Works</a>
          <span onClick={() => navigate('/cases')} className="hover:text-green-500 transition-colors cursor-pointer">Active Cases</span>
          <a href="#contact" className="hover:text-green-500 transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A2234] transition-colors"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {isLoggedIn ? (
            <Button 
              className="rounded-xl px-6 font-semibold bg-green-500 hover:bg-green-600 text-white" 
              onClick={() => navigate("/app/dashboard")}
            >
              Dashboard
            </Button>
          ) : (
            <Button 
              className="rounded-xl px-6 font-semibold bg-green-500 hover:bg-green-600 text-white" 
              onClick={() => openAuth("signin")}
            >
              <User className="w-4 h-4 mr-2" /> Login
            </Button>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-16 pb-24">
        
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 max-w-6xl mx-auto">
          {/* Left text */}
          <div className="w-full lg:w-[55%] text-center lg:text-left">
            <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-4">
              Reuniting Pets<br/>
              <span className="whitespace-nowrap">
                with Their <span className="text-green-500">Families</span>
                <Heart className="inline-block w-9 h-9 text-red-300 fill-current ml-2 rotate-[15deg] align-middle" />
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
              Report lost or found pets and let our smart system<br className="hidden lg:block"/>
              help bring them home faster.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-6">
              <Button className="w-full sm:w-auto h-12 rounded-xl px-6 text-sm font-bold bg-[#ff6b6b] hover:bg-[#ff5252] text-white transition-transform hover:scale-105" onClick={() => navigate('/app/report/lost')}>
                <PawPrint className="w-5 h-5 mr-2 text-white fill-current"/> Report Lost Pet
              </Button>
              <Button className="w-full sm:w-auto h-12 rounded-xl px-6 text-sm font-bold bg-green-500 hover:bg-green-600 text-white transition-transform hover:scale-105" onClick={() => navigate('/app/report/found')}>
                <PawPrint className="w-5 h-5 mr-2 text-white fill-current"/> Report Found Pet
              </Button>
              <Button variant="outline" className="w-full sm:w-auto h-12 rounded-xl px-6 text-sm font-bold border-2 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1A2234] transition-transform hover:scale-105" onClick={() => navigate("/cases")}>
                <Search className="w-4 h-4 mr-2" /> View Active Cases
              </Button>
            </div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center justify-center lg:justify-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Together, we can make every tail wag again <Heart className="w-3 h-3 text-red-400 fill-current inline"/>
            </div>
          </div>

          {/* Right illustration */}
          <div className="w-full lg:w-[45%] relative flex justify-center">
             <div className="relative w-full max-w-[600px] flex items-center justify-center">
               <img src={theme === 'dark' ? heroPetsDark : heroPets} className="w-[110%] md:w-[120%] h-auto object-contain z-10 drop-shadow-sm ml-0 lg:-ml-10" alt="Dog and Cat Illustration" />
             </div>
          </div>
        </div>

        {/* Stats Section */}
        <section className="mt-20 mb-24">
          <div className="bg-white dark:bg-[#151a25] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm mx-auto flex flex-wrap justify-between items-center gap-6 max-w-6xl">
             <div className="flex items-center gap-4 px-4 py-2">
               <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/40 flex items-center justify-center text-green-500">
                 <FileTextIcon className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-2xl font-bold text-gray-900 dark:text-white">120+</h3>
                 <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cases Reported</p>
               </div>
             </div>
             
             <div className="hidden md:block w-px h-12 bg-gray-100 dark:bg-gray-800"></div>

             <div className="flex items-center gap-4 px-4 py-2">
               <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/40 flex items-center justify-center text-red-400">
                 <Heart className="w-6 h-6" fill="currentColor"/>
               </div>
               <div>
                 <h3 className="text-2xl font-bold text-gray-900 dark:text-white">45+</h3>
                 <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pets Recovered</p>
               </div>
             </div>
             
             <div className="hidden md:block w-px h-12 bg-gray-100 dark:bg-gray-800"></div>

             <div className="flex items-center gap-4 px-4 py-2">
               <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/40 flex items-center justify-center text-amber-500">
                 <Users className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-2xl font-bold text-gray-900 dark:text-white">300+</h3>
                 <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Users</p>
               </div>
             </div>
             
             <div className="hidden md:block w-px h-12 bg-gray-100 dark:bg-gray-800"></div>

             <div className="flex items-center gap-4 px-4 py-2">
               <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-500">
                 <ShieldCheck className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-2xl font-bold text-gray-900 dark:text-white">24/7</h3>
                 <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Support</p>
               </div>
             </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">How It Works</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-12">Simple steps to help pets find their way home.</p>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-12 relative max-w-5xl mx-auto mt-28">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-[-20px] left-[10%] right-[10%] h-px border-t-2 border-dashed border-gray-200 dark:border-gray-700 z-0"></div>
            
            {[
              { id: 1, title: 'Report', desc: 'Submit a lost or found pet report.', icon: <FileTextIcon className="w-8 h-8 text-indigo-400" />, color: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { id: 2, title: 'Match', desc: 'We find potential matches using smart algorithms.', icon: <Search className="w-8 h-8 text-amber-400" />, color: 'bg-amber-50 dark:bg-amber-900/20' },
              { id: 3, title: 'Connect', desc: 'We connect you with the possible match.', icon: <Users className="w-8 h-8 text-green-400" />, color: 'bg-green-50 dark:bg-green-900/20' },
              { id: 4, title: 'Reunite', desc: 'Reunite pets with their loving families.', icon: <Heart className="w-8 h-8 text-red-400" />, color: 'bg-red-50 dark:bg-red-900/20' }
            ].map((step, i) => (
              <div key={i} className="flex-1 bg-white dark:bg-[#1A2234] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 relative z-10">
                 <div className="w-20 h-20 mx-auto rounded-full bg-white dark:bg-[#151a25] border-8 border-slate-50 dark:border-[#0f1520] flex flex-col items-center justify-center absolute -top-15 left-1/2 -translate-x-1/2 shadow-sm z-20">
                   {step.icon}
                   <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-xs font-bold flex items-center justify-center shadow-sm text-gray-700 dark:text-gray-300">{step.id}</div>
                 </div>
                 <div className="mt-8">
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                   <p className="text-gray-500 dark:text-gray-400 text-sm">{step.desc}</p>
                 </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose PawConnect */}
        <section className="mb-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">
            Why Choose <span className="text-green-500">PawConnect</span>?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {[
              { title: 'Location Tracking', desc: 'Track locations and high-risk areas to increase recovery chances.', icon: <MapPin className="w-6 h-6 text-green-500"/>, color: 'bg-green-100 text-green-600' },
              { title: 'Instant Notifications', desc: 'Get real-time alerts for matches, updates, and important news.', icon: <Bell className="w-6 h-6 text-red-400"/>, color: 'bg-red-100 text-red-500' },
              { title: 'Secure & Reliable', desc: 'Your data and pet information are stored securely and confidentially.', icon: <ShieldCheck className="w-6 h-6 text-amber-500"/>, color: 'bg-amber-100 text-amber-500' },
              { title: 'Smart Analytics', desc: 'Insights and statistics to improve recovery and community safety.', icon: <PieChart className="w-6 h-6 text-blue-500"/>, color: 'bg-blue-100 text-blue-500' },
              { title: 'Community Driven', desc: 'A caring community working together to help pets and their families.', icon: <Users className="w-6 h-6 text-purple-500"/>, color: 'bg-purple-100 text-purple-500' }
            ].map((feature, i) => (
              <div key={i} className="bg-white dark:bg-[#1A2234] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 text-center hover:shadow-md transition-shadow">
                 <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 \${feature.color} dark:bg-opacity-20`}>
                   {feature.icon}
                 </div>
                 <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                 <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-24 bg-gray-50 dark:bg-[#151a25] rounded-[3rem] p-8 md:p-12 relative max-w-6xl mx-auto border border-gray-100 dark:border-gray-800">
           <div className="flex justify-between items-center mb-8">
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
               What Pet Parents Say <Heart className="w-5 h-5 text-red-400 fill-current"/>
             </h2>
           </div>
           
           <div className="flex items-center gap-6 overflow-hidden relative px-10">
              <button className="hidden md:flex absolute left-0 w-10 h-10 rounded-full bg-white dark:bg-[#1A2234] border border-gray-200 dark:border-gray-700 items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm z-10 hover:bg-gray-50">
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex gap-6 w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide py-4">
                 {[
                   { name: 'Sarah Ahmed', quote: 'Thanks to PawConnect, we found our buddy in just 2 days!', img: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
                   { name: 'Rakib Hasan', quote: 'The platform is so easy to use and really works wonders.', img: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
                   { name: 'Nusrat Jahan', quote: 'I love how the community comes together for our furry friends.', img: 'https://i.pravatar.cc/150?u=a048581f4e29026701d' }
                 ].map((t, i) => (
                   <div key={i} className="min-w-[300px] flex-1 bg-white dark:bg-[#1A2234] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 snap-center">
                     <div className="flex items-start gap-4">
                       <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                       <div>
                         <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed mb-2">"{t.quote}"</p>
                         <p className="text-xs font-bold text-gray-900 dark:text-white">— {t.name}</p>
                         <div className="flex gap-0.5 mt-2">
                           {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 text-amber-400 fill-current" />)}
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
              
              <button className="hidden md:flex absolute right-0 w-10 h-10 rounded-full bg-white dark:bg-[#1A2234] border border-gray-200 dark:border-gray-700 items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm z-10 hover:bg-gray-50">
                <ArrowRight className="w-5 h-5" />
              </button>
           </div>
        </section>

        {/* Stay Updated */}
        <section className="mb-24 max-w-6xl mx-auto bg-[#f0f9f1] dark:bg-[#1a2e1d] rounded-3xl py-10 px-8 lg:py-8 lg:px-10 flex flex-col lg:flex-row items-center justify-between border border-green-50 dark:border-green-900/30 relative overflow-hidden lg:pr-56">
          <div className="flex items-center gap-6 z-10 lg:w-auto">
             <div className="w-16 h-16 rounded-full bg-[#dcfce7] dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
               <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Stay Updated</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">Subscribe to get the latest updates and success stories.</p>
             </div>
          </div>
          
          <div className="w-full lg:w-auto mt-6 lg:mt-0 flex flex-col sm:flex-row items-center gap-2 z-10 flex-1 lg:justify-end">
            <Input type="email" placeholder="Enter your email" className="w-full sm:w-[280px] h-12 bg-white dark:bg-[#151a25] border-gray-100 dark:border-gray-800 rounded-xl focus-visible:ring-2 focus-visible:ring-green-500" />
            <Button className="w-full sm:w-auto h-12 px-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl mt-2 sm:mt-0 transition-transform hover:scale-105">Subscribe</Button>
          </div>

          <div className="hidden lg:block absolute -right-2 -bottom-4 pointer-events-none">
             <img src={stayUpdated} className="w-56 h-auto object-contain" alt="Pets subscribe decoration" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1520] pt-16 pb-8">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white mb-4">
                <PawPrint className="w-6 h-6 text-black dark:text-white fill-current" />
                <span className="flex items-center">Paw<span className="text-green-500">Connect</span></span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                Reuniting pets with their families.<br/>
                Because every pet deserves to be home.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-green-500 transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-green-500 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Connect With Us</h4>
              <div className="flex gap-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-80 cursor-pointer"><FacebookIcon className="w-4 h-4"/></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white flex items-center justify-center hover:opacity-80 cursor-pointer"><InstagramIcon className="w-4 h-4"/></div>
                <div className="w-8 h-8 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center hover:opacity-80 cursor-pointer"><TwitterIcon className="w-4 h-4"/></div>
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:opacity-80 cursor-pointer"><Mail className="w-4 h-4"/></div>
              </div>
              <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <li>Email: support@pawconnect.com</li>
                <li>Phone: +880 1712-345678</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-400 dark:text-gray-500 pt-8 border-t border-gray-100 dark:border-gray-800">
            © 2024 PawConnect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helpers


function FileTextIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
  )
}

function FacebookIcon(props: any) { return <svg {...props} fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>; }
function InstagramIcon(props: any) { return <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>; }
function TwitterIcon(props: any) { return <svg {...props} fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>; }
