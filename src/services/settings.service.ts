"use client";

export interface BusinessDetails {
  shopName: string;
  address: string;
  phone: string;
  gstin: string;
}

export interface BillingPreferences {
  defaultGstRate: number;
  discountLimitPercent: number;
}

export type PrintTemplateType = "thermal" | "a4";

export const settingsService = {
  getPrintTemplate(): PrintTemplateType {
    if (typeof window === "undefined") return "a4";
    return (localStorage.getItem("settings_print_template") as PrintTemplateType) || "a4";
  },

  setPrintTemplate(template: PrintTemplateType): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("settings_print_template", template);
    }
  },

  getAutoPrint(): boolean {
    if (typeof window === "undefined") return true;
    const val = localStorage.getItem("settings_auto_print");
    return val === null ? true : val === "true";
  },

  setAutoPrint(enabled: boolean): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("settings_auto_print", String(enabled));
    }
  },



  getBusinessDetails(): BusinessDetails {
    const defaults = {
      shopName: "TyreRetail Pro ERP",
      address: "Opp. RTC Depot, Sri Swathi Complex, Tadepalligudem - 534101",
      phone: "9999999999",
      gstin: "37AAAAA0000A1Z5",
    };
    
    if (typeof window === "undefined") return defaults;
    
    const stored = localStorage.getItem("settings_business_details");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          shopName: parsed.shopName || defaults.shopName,
          address: parsed.address || defaults.address,
          phone: parsed.phone || defaults.phone,
          gstin: parsed.gstin || defaults.gstin,
        };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  },

  setBusinessDetails(details: BusinessDetails): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("settings_business_details", JSON.stringify(details));
    }
  },

  getBillingPreferences(): BillingPreferences {
    const defaults = {
      defaultGstRate: 18,
      discountLimitPercent: 20
    };
    
    if (typeof window === "undefined") return defaults;
    
    const stored = localStorage.getItem("settings_billing_preferences");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          defaultGstRate: Number(parsed.defaultGstRate) || defaults.defaultGstRate,
          discountLimitPercent: Number(parsed.discountLimitPercent) || defaults.discountLimitPercent,
        };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  },

  setBillingPreferences(prefs: BillingPreferences): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("settings_billing_preferences", JSON.stringify(prefs));
    }
  }
};
