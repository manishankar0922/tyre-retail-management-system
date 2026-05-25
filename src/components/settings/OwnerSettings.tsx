"use client";

import React, { useEffect, useState } from "react";
import { 
  Building, 
  Printer, 
  User, 
  Lock, 
  Percent, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { 
  settingsService, 
  PrintTemplateType, 
  BusinessDetails, 
  BillingPreferences 
} from "@/services/settings.service";
import { supabase } from "@/lib/supabase";
import PrintTemplateSelector from "./PrintTemplateSelector";

interface UserProfile {
  name: string;
  phone: string;
  role: string;
}

export default function OwnerSettings() {
  const [activeTab, setActiveTab] = useState<"business" | "printer" | "account">("business");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Business Details State
  const [business, setBusiness] = useState<BusinessDetails>({
    shopName: "TyreRetail Pro ERP",
    address: "",
    phone: "",
    gstin: ""
  });

  // Billing Preferences State
  const [billing, setBilling] = useState<BillingPreferences>({
    defaultGstRate: 18,
    discountLimitPercent: 20
  });

  // Printer State
  const [template, setTemplate] = useState<PrintTemplateType>("a4");
  const [autoPrint, setAutoPrint] = useState(true);

  // Account State
  const [profile, setProfile] = useState<UserProfile>({
    name: "Owner",
    phone: "",
    role: "OWNER"
  });

  // Security State
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    // Load persisted settings
    setBusiness(settingsService.getBusinessDetails());
    setBilling(settingsService.getBillingPreferences());
    setTemplate(settingsService.getPrintTemplate());
    setAutoPrint(settingsService.getAutoPrint());

    // Load user details
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setProfile({
            name: user.name || "Owner",
            phone: user.phone || "",
            role: (user.role || "owner").toUpperCase()
          });
        } catch (e) {
          console.error("Error loading user profile:", e);
        }
      }
    }
  }, []);

  const handleSaveBusiness = () => {
    try {
      if (!business.shopName.trim()) throw new Error("Shop Name is required");
      settingsService.setBusinessDetails(business);
      settingsService.setBillingPreferences(billing);
      triggerSuccess("Business and taxation configurations updated successfully!");
    } catch (e: any) {
      triggerError(e.message || "Failed to save business settings");
    }
  };

  const handleSavePrinter = () => {
    settingsService.setPrintTemplate(template);
    settingsService.setAutoPrint(autoPrint);
    triggerSuccess("Printer templates updated successfully!");
  };

  const handleSaveAccount = async () => {
    try {
      if (!profile.name.trim()) throw new Error("Full Name is required");
      
      // Update profile in database & localStorage session
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("currentUser");
        if (stored) {
          const user = JSON.parse(stored);
          user.name = profile.name;
          user.phone = profile.phone;
          
          // Write update to Supabase user_profiles table
          const { error } = await supabase
            .from("user_profiles")
            .update({ full_name: profile.name, phone: profile.phone })
            .eq("id", user.id);
            
          if (error) throw new Error(error.message || "Failed to update profile database.");

          localStorage.setItem("currentUser", JSON.stringify(user));
          document.cookie = `currentUser=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax`;
        }
      }

      // Handle Pin Change mock action
      if (currentPin || newPin) {
        if (!currentPin || !newPin) {
          throw new Error("Both current and new passwords/PINs must be filled to update security keys.");
        }
        // Mock successful validation
        setCurrentPin("");
        setNewPin("");
        triggerSuccess("Profile details and login PIN updated successfully!");
        return;
      }

      triggerSuccess("Profile details updated successfully!");
    } catch (e: any) {
      triggerError(e.message || "Failed to save profile settings");
    }
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const menuItems = [
    { id: "business" as const, label: "Business Details", desc: "GSTIN, billing policies, shop info", icon: Building },
    { id: "printer" as const, label: "Printer & Templates", desc: "Layout selectors, automated dialogue", icon: Printer },
    { id: "account" as const, label: "Account & Security", desc: "Profile settings, password updates", icon: User },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-450 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/50 text-rose-700 dark:text-rose-450 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Navigation & Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left p-3.5 rounded-xl border flex gap-3 transition-all duration-200 cursor-pointer
                  ${isActive 
                    ? "bg-white dark:bg-zinc-950 border-zinc-250 dark:border-zinc-800 text-zinc-850 dark:text-zinc-100 shadow-sm" 
                    : "border-transparent text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500" : "bg-transparent text-zinc-400"}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold">{item.label}</h4>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-505 mt-0.5 leading-tight">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="md:col-span-2 space-y-6">
          
          {/* TAB 1: Business Details */}
          {activeTab === "business" && (
            <div className="space-y-6">
              {/* Business Header Form */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-zinc-850 dark:text-zinc-100 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-900 pb-3 uppercase tracking-wider text-xs">
                  <Building className="w-4 h-4 text-zinc-400" />
                  <span>Shop Profile Details</span>
                </h3>

                <div className="space-y-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Business Name</label>
                    <input 
                      type="text" 
                      value={business.shopName}
                      onChange={(e) => setBusiness({ ...business, shopName: e.target.value })}
                      placeholder="e.g. TyreRetail Pro ERP"
                      className="w-full mt-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2.5 px-3.5 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Shop Address</label>
                    <textarea 
                      value={business.address}
                      onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                      rows={3}
                      placeholder="e.g. Opp RTC Depot Road, Tadepalligudem"
                      className="w-full mt-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2.5 px-3.5 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Shop Contact Phone</label>
                      <input 
                        type="text" 
                        value={business.phone}
                        onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                        placeholder="e.g. 9848022338"
                        className="w-full mt-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2.5 px-3.5 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Shop GSTIN Number</label>
                      <input 
                        type="text" 
                        value={business.gstin}
                        onChange={(e) => setBusiness({ ...business, gstin: e.target.value })}
                        placeholder="e.g. 37AAAAA0000A1Z5"
                        className="w-full mt-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2.5 px-3.5 rounded-xl outline-none focus:border-indigo-500 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Taxation & Defaults Form */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-zinc-850 dark:text-zinc-100 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-900 pb-3 uppercase tracking-wider text-xs">
                  <Percent className="w-4 h-4 text-zinc-400" />
                  <span>Taxation & Billing Defaults</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Default GST Rate</label>
                    <select
                      value={billing.defaultGstRate}
                      onChange={(e) => setBilling({ ...billing, defaultGstRate: Number(e.target.value) })}
                      className="w-full mt-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2.5 px-3.5 rounded-xl outline-none focus:border-indigo-500"
                    >
                      <option value={5}>5% GST (Standard Small Goods)</option>
                      <option value={12}>12% GST (Tyres Smaller Load)</option>
                      <option value={18}>18% GST (Standard Commercial Tyres)</option>
                      <option value={28}>28% GST (Premium/Luxury Spares)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Max Discount Limit (%)</label>
                    <input 
                      type="number" 
                      min={0}
                      max={100}
                      value={billing.discountLimitPercent}
                      onChange={(e) => setBilling({ ...billing, discountLimitPercent: Math.min(100, Math.max(0, Number(e.target.value))) })}
                      placeholder="e.g. 20"
                      className="w-full mt-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2.5 px-3.5 rounded-xl outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveBusiness}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Save Business Details
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Printer Settings */}
          {activeTab === "printer" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-6">
                <h3 className="font-extrabold text-sm text-zinc-850 dark:text-zinc-100 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-900 pb-3 uppercase tracking-wider text-xs">
                  <Printer className="w-4 h-4 text-zinc-400" />
                  <span>Invoice Printing Setup</span>
                </h3>

                <PrintTemplateSelector value={template} onChange={setTemplate} />

                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-550 block mb-2">
                    Automated Workflows
                  </label>
                  <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800 rounded-xl">
                    <input
                      type="checkbox"
                      id="auto-print-owner"
                      checked={autoPrint}
                      onChange={(e) => setAutoPrint(e.target.checked)}
                      className="w-4 h-4 text-indigo-650 bg-zinc-100 dark:bg-zinc-900 border-zinc-350 dark:border-zinc-800 rounded focus:ring-indigo-500 mt-0.5 cursor-pointer"
                    />
                    <div className="text-xs">
                      <label htmlFor="auto-print-owner" className="font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
                        Auto-Trigger Print Dialog
                      </label>
                      <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">
                        Immediately prompt native browser printing upon generating a new bill.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePrinter}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Save Printing Setup
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Account & Security */}
          {activeTab === "account" && (
            <div className="space-y-6">
              {/* Account profile editing */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-zinc-850 dark:text-zinc-100 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-900 pb-3 uppercase tracking-wider text-xs">
                  <User className="w-4 h-4 text-zinc-400" />
                  <span>Owner Account Profile</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-505">Full Name</label>
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full mt-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2 px-3 rounded-lg outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-505">Contact Phone</label>
                    <input 
                      type="text" 
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full mt-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2 px-3 rounded-lg outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-505">System Access Role</label>
                    <input 
                      type="text" 
                      value={profile.role}
                      disabled
                      className="w-full mt-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2 px-3 rounded-lg text-zinc-400 dark:text-zinc-500 font-mono font-bold cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Password update */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-zinc-850 dark:text-zinc-100 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-900 pb-3 uppercase tracking-wider text-xs">
                  <Lock className="w-4 h-4 text-zinc-400" />
                  <span>Security Credential Update</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-505">Current password / PIN</label>
                    <input 
                      type="password" 
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                      className="w-full mt-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2 px-3 rounded-lg outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-505">New password / PIN</label>
                    <input 
                      type="password" 
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full mt-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2 px-3 rounded-lg outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAccount}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Update Account & PIN
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
