import { supabase } from "@/integrations/supabase/client";

export const investorData = [
  { name: "1V", firm_name: "1V", website: "https://one-ventures.com.au/", geographies: ["Sydney"] },
  { name: "77 Partners", firm_name: "77 Partners", website: "www.77partners.vc", geographies: ["Brisbane"] },
  { name: "808 Ventures", firm_name: "808 Ventures", website: "https://www.808ventures.vc", geographies: ["Perth"] },
  { name: "1835i", firm_name: "1835i", website: "www.1835i.com", geographies: ["Melbourne"] },
  { name: "Acorn Capital", firm_name: "Acorn Capital", website: "https://acorncapital.com.au", geographies: ["Melbourne"] },
  { name: "Adams Street", firm_name: "Adams Street", website: "https://www.adamsstreetpartners.com/", geographies: ["Chicago"] },
  { name: "AfterWork Ventures", firm_name: "AfterWork Ventures", website: "afterwork.vc", geographies: ["Sydney"] },
  { name: "Agnition Ventures", firm_name: "Agnition Ventures", website: "https://agnition.ventures/", geographies: ["Christchurch"] },
  { name: "AgriZeroNZ", firm_name: "AgriZeroNZ", website: "AgriZero.nz", geographies: ["Auckland"] },
  { name: "Airtree", firm_name: "Airtree", website: "https://airtree.vc/", geographies: ["Sydney"] },
  { name: "Alabaster", firm_name: "Alabaster", website: "https://www.alabaster.com/", geographies: ["San Francisco"] },
  { name: "Alberts Impact Ventures", firm_name: "Alberts Impact Ventures", website: "alberts.co", geographies: ["Sydney"] },
  { name: "Alchemy Ventures", firm_name: "Alchemy Ventures", website: "http://www.alchemventures.com.au", geographies: ["Sydney"] },
  { name: "ALIAVIA Ventures", firm_name: "ALIAVIA Ventures", website: "https://www.aliavia.vc/", geographies: ["California"] },
  { name: "Alium Capital", firm_name: "Alium Capital", website: "https://aliumcap.com/", geographies: ["Sydney"] },
  { name: "Altered Capital", firm_name: "Altered Capital", website: "alteredcapital.com", geographies: ["Auckland"] },
  { name: "Antler Fund LP", firm_name: "Antler Fund LP", website: "antler.co", geographies: ["Sydney"] },
  { name: "ANU Connect Ventures", firm_name: "ANU Connect Ventures", website: "anuconnectventures.com.au", geographies: ["Canberra"] },
  { name: "ANZi Ventures", firm_name: "ANZi Ventures", website: "anz.com", geographies: ["Sydney"] },
  { name: "Apex Capital Partners", firm_name: "Apex Capital Partners", website: "apexcapital.com.au", geographies: ["Sydney"] },
  { name: "AraCapital", firm_name: "AraCapital", website: "aracapital.com.au", geographies: ["Sydney"] },
  { name: "Arbor Capital", firm_name: "Arbor Capital", website: "arborcapital.co", geographies: ["Brisbane"] },
  { name: "Arcanys Ventures", firm_name: "Arcanys Ventures", website: "ventures.arcanys.com", geographies: [] },
  { name: "Archangel Ventures", firm_name: "Archangel Ventures", website: "archangel.vc", geographies: ["Melbourne"] },
  { name: "Arowana Partners", firm_name: "Arowana Partners", website: "arowanaco.com/venture-capital", geographies: ["London"] },
  { name: "Artesian Capital Management", firm_name: "Artesian Capital Management", website: "artesianinvest.com", geographies: ["Sydney"] },
  { name: "AS1 Growth Partners", firm_name: "AS1 Growth Partners", website: "as1growthpartners.com", geographies: ["Sydney"] },
  { name: "Athletic Ventures", firm_name: "Athletic Ventures", website: "athletic.vc", geographies: ["Sydney"] },
  { name: "Aura Ventures", firm_name: "Aura Ventures", website: "aura.vc", geographies: ["Sydney"] },
  { name: "Australian Unity Future of Healthcare Fund", firm_name: "Australian Unity Future of Healthcare Fund", website: "australianunity.com.au", geographies: ["Sydney"] },
  { name: "Backit Ventures", firm_name: "Backit Ventures", website: "backit.ventures", geographies: ["Brisbane"] },
  { name: "Bailador Technology Investments", firm_name: "Bailador Technology Investments", website: "www.bailador.com.au", geographies: ["Sydney"] },
  { name: "Bain Capital", firm_name: "Bain Capital", website: "https://www.baincapitalprivateequity.com/", geographies: ["Boston"] },
  { name: "Beachhead Venture Capital", firm_name: "Beachhead Venture Capital", website: "beachhead.vc", geographies: ["Sydney"] },
  { name: "Black Sheep Capital", firm_name: "Black Sheep Capital", website: "https://blacksheepcapital.com.au/", geographies: ["Brisbane"] },
  { name: "Blackbird Ventures", firm_name: "Blackbird Ventures", website: "https://blackbird.vc/", geographies: ["Sydney"] },
  { name: "Bombora Investment Management", firm_name: "Bombora Investment Management", website: "https://www.bomboragroup.com.au/", geographies: ["Sydney"] },
  { name: "Boson Ventures", firm_name: "Boson Ventures", website: "https://www.boson.vc/", geographies: ["Sydney"] },
  { name: "Braddon Capital", firm_name: "Braddon Capital", website: "www.braddoncapital.com", geographies: [] },
  { name: "Brandon Capital Partners", firm_name: "Brandon Capital Partners", website: "https://www.brandoncapital.com.au/", geographies: ["Melbourne"] },
  { name: "Breakthrough Victoria", firm_name: "Breakthrough Victoria", website: "https://breakthroughvictoria.com/", geographies: ["Melbourne"] },
  { name: "Breyer Capital", firm_name: "Breyer Capital", website: "https://breyercapital.com/", geographies: ["Austin"] },
  { name: "BridgeLane Group", firm_name: "BridgeLane Group", website: "https://bridgelane.com.au/", geographies: ["Sydney"] },
  { name: "Cardinia Ventures", firm_name: "Cardinia Ventures", website: "https://www.cardiniaventures.com", geographies: ["Melbourne"] },
  { name: "Carthona Capital", firm_name: "Carthona Capital", website: "https://www.carthonacapital.com/", geographies: ["Sydney"] },
  { name: "Clean Energy Finance Corporation (CEFC)", firm_name: "Clean Energy Finance Corporation (CEFC)", website: "https://www.cefc.com.au/where-we-invest/sustainable-economy/innovation-fund/", geographies: ["Sydney"] },
  { name: "Climate Tech Partners", firm_name: "Climate Tech Partners", website: "https://climatetech.partners/", geographies: ["Sydney"] },
  { name: "Clinton Capital Partners", firm_name: "Clinton Capital Partners", website: "https://www.clintoncapitalpartners.com.au/", geographies: ["Sydney"] },
  { name: "CMB Capital", firm_name: "CMB Capital", website: "https://www.cmbcapital.com.au", geographies: ["Sydney"] },
  { name: "Common Sense Ventures", firm_name: "Common Sense Ventures", website: "www.commonsense.vc", geographies: ["Melbourne"] },
  { name: "Cove Capital", firm_name: "Cove Capital", website: "https://covecapital.com.au/", geographies: ["Melbourne"] },
  { name: "CP Ventures", firm_name: "CP Ventures", website: "https://cp.ventures/", geographies: ["Sydney"] },
];

export async function importInvestorDataToDatabase() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Add user_id to each investor record
    const investorsWithUserId = investorData.map(investor => ({
      ...investor,
      user_id: user.id,
      pipeline_stage: "research",
      priority: "medium"
    }));

    const { data, error } = await supabase
      .from("investors")
      .insert(investorsWithUserId)
      .select();

    if (error) throw error;

    return { success: true, count: data?.length || 0 };
  } catch (error: any) {
    console.error("Import error:", error);
    return { success: false, error: error.message };
  }
}
