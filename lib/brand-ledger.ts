type AnswerSet = Record<string, unknown>;

export type LedgerCategory = { key:string; name:string; weight:number; move:string; cta:string };
export type LedgerItem = { key:string; category:string; prompt:string; states:[string,string,string,string] };

export const ledgerCategories: LedgerCategory[] = [
  {key:"ownership",name:"Ownership & Protection",weight:15,move:"Own your name and the rights around it.",cta:"Build the ownership file"},
  {key:"offer",name:"Offer & Monetization",weight:15,move:"Turn demand into a priced ladder.",cta:"Build the value ladder"},
  {key:"digital",name:"Digital Real Estate",weight:12,move:"Make the site capture, book, and sell.",cta:"Build the conversion path"},
  {key:"audience",name:"Audience & Distribution",weight:12,move:"Move attention from rented platforms to owned reach.",cta:"Build the owned audience"},
  {key:"content",name:"Content Engine",weight:11,move:"Replace bursts with a documented production system.",cta:"Build the content engine"},
  {key:"proof",name:"Proof & Credibility",weight:10,move:"Package the proof so opportunity can verify you quickly.",cta:"Build the press kit"},
  {key:"visual",name:"Visual Identity",weight:10,move:"Make every visible asset signal one standard.",cta:"Build the brand bible"},
  {key:"voice",name:"Voice & Communication",weight:6,move:"Turn expertise into a message that travels.",cta:"Build the signature talk"},
  {key:"physical",name:"Physical Presentation",weight:5,move:"Align the wardrobe with the rooms ahead.",cta:"Build the image brief"},
  {key:"team",name:"Team & Structure",weight:4,move:"Remove the founder from work someone else should own.",cta:"Build the operating layer"},
];

const GENERIC: [string,string,string,string] = ["Don't have it","Have it, weak or dated","Have it, it works","Have it, it earns"];
const item = (category:string,key:string,prompt:string,states:LedgerItem["states"]=GENERIC):LedgerItem=>({category,key:`ledger_${key}`,prompt,states});

export const brandLedgerItems: LedgerItem[] = [
  item("ownership","trademark","Is your name or brand registered as a trademark?",["No","Searched, never filed","Application pending","Registered"]),
  item("ownership","domain","Do you own the .com and key variants?",["No","Someone else owns it","I own the .com","I own .com, variants, and handles"]),
  item("ownership","entity","Is the business a registered entity?",["No","Sole proprietor","LLC","Corporation with operating agreement"]),
  item("ownership","copyright","Do you have signed copyright assignments for logo and website?",["No","Not sure","Verbal only","Signed assignments on file"]),
  item("ownership","handles","Are handles secured and consistent across platforms?"),
  item("ownership","contracts","Do you have lawyer-drafted client contracts?",["No","Borrowed template","Lawyer-drafted","Reviewed in the last year"]),
  item("visual","logo","Does the logo exist in vector and every required format?"),
  item("visual","guidelines","How complete are the written brand guidelines?",["None","Moodboard","One-page guide","Full usage system"]),
  item("visual","palette","Is the color and typography system defined?"),
  item("visual","photos","When was the last professional photo shoot?",["Never","3+ years","1-3 years","Within 12 months"]),
  item("visual","templates","Do decks, posts, and documents share templates?"),
  item("digital","website","How effectively does the website work?",["None","Link-in-bio only","Site exists","Converts and is measured"]),
  item("digital","capture","Does the site capture email addresses?"),
  item("digital","checkout","Can a stranger book or buy in under 60 seconds?"),
  item("digital","funnel","Is there a defined front-end offer and funnel?"),
  item("digital","analytics","Is analytics installed and reviewed monthly?"),
  item("content","podcast","What is the state of the podcast?",["No podcast","Started and stopped","Active","Active and earning"]),
  item("content","youtube","What is the state of YouTube?",["No channel","Started and stopped","Active","Active and earning"]),
  item("content","shortform","What is the short-form cadence?",["Never","Sporadic","Weekly","Daily"]),
  item("content","newsletter","What is the newsletter state?",["None","Started and stopped","Active","Active and earning"]),
  item("content","system","Is the content system documented?"),
  item("content","archive","How much unused raw footage exists?",["None","A little","Hours","Years"]),
  item("voice","training","Have you trained for camera or stage?",["Never","Read about it","One workshop","Ongoing coaching"]),
  item("voice","pitch","Can you explain the offer in 30 seconds?",["No","Roughly","Yes","Yes, and it converts"]),
  item("voice","press","Have you completed live interviews or press appearances?"),
  item("voice","keynote","Is there a signature keynote ready tomorrow?"),
  item("voice","crisis","Is there a plan for reputation or crisis response?"),
  item("physical","uniform","Is there a defined signature look or uniform?"),
  item("physical","rooms","Does the wardrobe match the rooms being entered?"),
  item("physical","stylist","What is the relationship with a stylist?",["Never","Once","Occasionally","On retainer"]),
  item("physical","camera_ready","Could you be photographed tomorrow without buying anything?"),
  item("audience","email_size","How large is the email list?",["0","Under 500","500-5,000","5,000+"]),
  item("audience","platform_size","How large is the strongest platform?",["Under 1,000","1,000-10,000","10,000-100,000","100,000+"]),
  item("audience","owned_share","How much audience is owned through email or SMS?",["All rented","Mostly rented","About half","Mostly owned"]),
  item("audience","best_content","Do you know the best-performing content and why it worked?"),
  item("offer","named_offer","Is there a named offer with a published price?"),
  item("offer","ladder","How complete is the price ladder?",["One price","Two tiers","Low-mid-high ladder","Ladder with recurring revenue"]),
  item("offer","recurring","What share of revenue recurs?",["None","Under 10%","10-40%","Over 40%"]),
  item("offer","cac","Do you know the cost to acquire one customer?"),
  item("proof","search","What appears when someone searches your name?",["Nothing","Someone else","Mixed results","Owned properties and press"]),
  item("proof","testimonials","Are testimonials organized in writing or video?"),
  item("proof","credits","How consistent are press, awards, or speaking credits?",["None","One or two","Several","Ongoing"]),
  item("proof","presskit","Can you send a bio, headshot, and one-sheet in five minutes?"),
  item("team","inbound","Who handles inbound inquiries?",["Nobody","Me","Shared inbox","A dedicated person"]),
  item("team","representative","Do you have a manager, agent, or representative?"),
  item("team","books","How current are the books?",["Not current","Behind","Current","Current with monthly review"]),
];

export type LedgerResult = {
  score:number;
  band:string;
  categories:Array<LedgerCategory & {score:number}>;
  nextMoves:Array<LedgerCategory & {score:number}>;
};

export function scoreBrandLedger(answers: AnswerSet): LedgerResult | null {
  const categories = ledgerCategories.map((category) => {
    const items = brandLedgerItems.filter((entry) => entry.category === category.key);
    const values = items.map((entry) => Number(answers[entry.key])).filter((value) => Number.isFinite(value) && value >= 0 && value <= 3);
    const score = values.length ? Math.round((values.reduce((sum,value)=>sum+value,0)/(items.length*3))*100) : 0;
    return {...category,score};
  });
  if (!brandLedgerItems.some((entry) => answers[entry.key] !== undefined && answers[entry.key] !== null)) return null;
  const weighted = categories.reduce((sum,category)=>sum+category.score*category.weight,0)/100;
  const score = Math.round(weighted*10);
  const band = score < 300 ? "Unprotected" : score < 550 ? "Assembling" : score < 750 ? "Established" : "Compounding";
  return {score,band,categories,nextMoves:[...categories].sort((a,b)=>a.score-b.score || b.weight-a.weight).slice(0,3)};
}
