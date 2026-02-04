import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, CheckCircle } from "lucide-react";

declare const PaystackPop: any;

interface Course {
  id: string;
  code: string;
  title: string;
  price: number;
}

interface BundleCardProps {
  courses: Course[];
  userEmail: string;
  userId: string;
}

export function BundleCard({ courses, userEmail, userId }: BundleCardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Calculate Bundle Price (20% off total)
  const totalValue = courses.reduce((sum, c) => sum + c.price, 0);
  const bundlePrice = Math.floor(totalValue * 0.8);
  const savings = totalValue - bundlePrice;

  // Prepare purchase records
  const courseIdsToUnlock = courses.map(c => ({
    user_id: userId,
    course_id: c.id
  }));

  const handleBundlePayment = () => {
    if (typeof PaystackPop === 'undefined') {
      toast({ title: "Error", description: "Connection error. Please refresh.", variant: "destructive" });
      return;
    }

    const handler = PaystackPop.setup({
      key: 'pk_live_2320cc6bb508955bd07391f75a4c73d757a0d6f6',
      email: userEmail,
      amount: bundlePrice * 100,
      currency: 'NGN',
      metadata: {
        custom_fields: [
          { display_name: "Purchase Type", variable_name: "purchase_type", value: "bundle" },
          { display_name: "Course Count", variable_name: "course_count", value: courses.length.toString() }
        ]
      },
      callback: async function(response: any) {
        setLoading(true);
        console.log("Bundle Payment Success. Unlocking " + courseIdsToUnlock.length + " courses...");

        // Bulk insert all purchases
        const { error } = await supabase
          .from('purchases')
          .insert(courseIdsToUnlock);
        
        if (!error) {
          toast({ 
            title: "Bundle Unlocked! 🚀", 
            description: `You now have access to all ${courses.length} courses.`,
          });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          // If error (e.g. duplicates), insert one by one safely
          toast({ title: "Processing...", description: "Finalizing your courses..." });
          for (const item of courseIdsToUnlock) {
            await supabase.from('purchases').insert([item]);
          }
          window.location.reload();
        }
        setLoading(false);
      },
      onClose: function() {
        toast({ title: "Cancelled", description: "Bundle offer is still waiting for you!" });
      }
    });
    handler.openIframe();
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] p-6 md:p-8 mb-8 text-white shadow-xl group transition-transform hover:scale-[1.005]">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 z-0"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-100 border border-yellow-200/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3 h-3 text-yellow-300" /> Best Value Offer
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            {courses.length === 1 ? "Complete Your Collection" : "Unlock Your Full Semester"}
          </h2>
          <p className="text-blue-100 text-sm max-w-sm leading-relaxed">
            Get instant access to {courses.length === 1 ? "your remaining course" : (
              <>all <strong className="text-white">{courses.length} remaining courses</strong></>
            )} at a massive discount.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs md:text-sm font-medium text-blue-50">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4"/> 100% Exam Coverage</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Instant Access</span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 min-w-[180px] md:min-w-[200px] border border-white/10 flex flex-col items-center text-center w-full md:w-auto">
          <span className="text-slate-300 line-through text-sm font-medium">₦{totalValue.toLocaleString()}</span>
          <span className="text-2xl md:text-3xl font-black text-white mb-1">₦{bundlePrice.toLocaleString()}</span>
          <span className="text-xs font-bold text-green-300 bg-green-500/20 px-2 py-0.5 rounded mb-4">
            Save ₦{savings.toLocaleString()}
          </span>
          
          <Button 
            onClick={handleBundlePayment}
            disabled={loading}
            className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold h-11 md:h-12 rounded-xl shadow-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Get Full Bundle"}
          </Button>
        </div>
      </div>
    </div>
  );
}
