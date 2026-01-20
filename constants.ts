import { AppSettings } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  newCardsPerDay: 20,
  reviewsPerDay: 100,
  learningSteps: [1, 10], // 1 min, 10 min
  initialEaseFactor: 2.5,
  easyBonus: 1.3,
  darkMode: false,
};

export const MIN_EASE_FACTOR = 1.3;

export const DB_NAME = 'AnkiDrugDB';
export const DB_VERSION = 2;

// Fixed IDs to prevent duplicates and allow updates
export const HAMILTON_DECK_ID = 'deck_hamilton_v1';
export const CARDIO_DECK_ID = 'deck_cardio_v1';

export const COLORS = {
  again: 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700',
  hard: 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700',
  good: 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700',
  easy: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700',
};

export const HAMILTON_DATA = [
  { generic: "acetaminophen", brand: "Tylenol" },
  { generic: "acetylsalicylic acid", brand: "Aspirin" },
  { generic: "acyclovir", brand: "Zovirax" },
  { generic: "adenosine", brand: "Adenocard" },
  { generic: "amiodarone", brand: "Cordarone" },
  { generic: "amlodipine", brand: "Norvasc" },
  { generic: "amoxicillin/potassium clavulanate", brand: "Clavulin" },
  { generic: "apixaban", brand: "Eliquis" },
  { generic: "atorvastatin", brand: "Lipitor" },
  { generic: "atropine sulfate", brand: "Isopto Atropine" },
  { generic: "azithromycin", brand: "Zithromax" },
  { generic: "bacitracin/polymyxin", brand: "Polysporin or Polyderm" },
  { generic: "bisacodyl", brand: "Dulcolax" },
  { generic: "bisoprolol", brand: "Monocor" },
  { generic: "bupivacaine", brand: "Marcaine or Sensorcaine" },
  { generic: "calcium carbonate", brand: "Tums" },
  { generic: "calcium chloride", brand: "Calciject" },
  { generic: "calcium citrate", brand: "Caltrate" },
  { generic: "candesartan", brand: "Atacand" },
  { generic: "carbetocin", brand: "Duratocin" },
  { generic: "cefazolin", brand: "Ancef" },
  { generic: "ceftazidime", brand: "Fortaz" },
  { generic: "ceftriaxone", brand: "Rocephin" },
  { generic: "cefuroxime", brand: "Zinacef or Ceftin" },
  { generic: "cephalexin", brand: "Keflex" },
  { generic: "cetirizine", brand: "Reactine" },
  { generic: "cholecalciferol", brand: "Vitamin D3" },
  { generic: "ciprofloxacin", brand: "Cipro" },
  { generic: "clopidogrel", brand: "Plavix" },
  { generic: "cyanocobalamin", brand: "Vitamin B-12" },
  { generic: "dalteparin", brand: "Fragmin" },
  { generic: "dexamethasone", brand: "Decadron" },
  { generic: "digoxin", brand: "Toloxin" },
  { generic: "diltiazem", brand: "Cardizem" },
  { generic: "dimenhydrinate", brand: "Gravol" },
  { generic: "diphenhydramine", brand: "Benadryl" },
  { generic: "enoxaparin", brand: "Lovenox" },
  { generic: "epinephrine", brand: "Adrenalin" },
  { generic: "ertapenem", brand: "Invanz" },
  { generic: "fentanyl", brand: "Sublimaze or Duragesic" },
  { generic: "fondaparinux", brand: "Arixtra" },
  { generic: "furosemide", brand: "Lasix" },
  { generic: "gabapentin", brand: "Neurontin" },
  { generic: "haloperidol", brand: "Haldol" },
  { generic: "hydralazine", brand: "Apresoline" },
  { generic: "hydrocortisone sodium succinate", brand: "Cortef" },
  { generic: "hydromorphone", brand: "Dilaudid or Hydromorph Contin" },
  { generic: "ibuprofen", brand: "Advil" },
  { generic: "insulin glargine", brand: "Lantus or Basaglar" },
  { generic: "insulin lispro", brand: "Humalog or Admelog" },
  { generic: "insulin regular", brand: "Humulin R" },
  { generic: "ipratropium", brand: "Atrovent" },
  { generic: "iron sucrose", brand: "Venofer" },
  { generic: "ketamine", brand: "Ketalar" },
  { generic: "ketorolac", brand: "Toradol" },
  { generic: "labetalol", brand: "Trandate" },
  { generic: "levetiracetam", brand: "Keppra" },
  { generic: "levothyroxine sodium", brand: "Synthroid or Eltroxin" },
  { generic: "lidocaine", brand: "Xylocaine" },
  { generic: "lorazepam", brand: "Ativan" },
  { generic: "metformin", brand: "Glucophage or Glumetza" },
  { generic: "metoclopramide", brand: "Maxeran" },
  { generic: "metoprolol", brand: "Lopressor" },
  { generic: "metronidazole", brand: "Flagyl" },
  { generic: "midazolam", brand: "Versed" },
  { generic: "morphine", brand: "Statex" },
  { generic: "naloxone", brand: "Narcan" },
  { generic: "naproxen", brand: "Aleve" },
  { generic: "neostigmine methylsulfate", brand: "Prostigmin" },
  { generic: "nitroglycerin", brand: "Nitrostat" },
  { generic: "norepinephrine", brand: "Levophed" },
  { generic: "ondansetron", brand: "Zofran" },
  { generic: "oxytocin", brand: "Pitocin" },
  { generic: "pantoprazole", brand: "Pantoloc or Tecta" },
  { generic: "phenylephrine HCl", brand: "Mydfrin" },
  { generic: "phytonadione", brand: "Vitamin K" },
  { generic: "piperacillin sodium/tazobactam", brand: "Tazocin" },
  { generic: "polyethylene glycol 3350", brand: "Lax-a-day or Restoralax" },
  { generic: "prednisone", brand: "Deltasone" },
  { generic: "pregabalin", brand: "Lyrica" },
  { generic: "propofol", brand: "Diprivan" },
  { generic: "quetiapine fumarate", brand: "Seroquel" },
  { generic: "ramipril", brand: "Altace" },
  { generic: "remifentanil", brand: "Ultiva" },
  { generic: "rivaroxaban", brand: "Xarelto" },
  { generic: "rocuronium", brand: "Zemuron" },
  { generic: "rosuvastatin", brand: "Crestor" },
  { generic: "salbutamol", brand: "Ventolin" },
  { generic: "sennosides", brand: "Senokot" },
  { generic: "sodium chloride 3 %", brand: "Hypertonic Saline" },
  { generic: "sodium phosphates", brand: "Fleet" },
  { generic: "sucrose", brand: "SweetUms" },
  { generic: "tetracaine", brand: "Ametop" },
  { generic: "thiamine", brand: "Vitamin B1" },
  { generic: "ticagrelor", brand: "Brilinta" },
  { generic: "tranexamic acid", brand: "Cyklokapron" },
  { generic: "trazodone", brand: "Desyrel" },
  { generic: "vancomycin", brand: "Vancocin" },
  { generic: "warfarin", brand: "Coumadin" }
];

export const CARDIO_DATA = [
  // Cardiac Arrest / Crash Cart Drugs
  { generic: "Epinephrine", brand: "Adrenalin" },
  { generic: "Amiodarone", brand: "Cordarone" },
  { generic: "Lidocaine", brand: "Xylocaine" },
  { generic: "Adenosine", brand: "Adenocard" },
  { generic: "Atropine", brand: "Atropine" },
  { generic: "Isoproterenol", brand: "Isuprel" },
  { generic: "Dopamine", brand: "Intropin" },
  { generic: "Procainamide", brand: "Pronestyl" },
  { generic: "Calcium chloride", brand: "Calcium Chloride" },
  { generic: "Magnesium sulfate", brand: "Magnesium Sulfate" },
  
  // Antiplatelets
  { generic: "Acetylsalicylic acid (ASA)", brand: "Aspirin" },
  { generic: "Clopidogrel", brand: "Plavix" },
  { generic: "Ticagrelor", brand: "Brilinta" },
  { generic: "Prasugrel", brand: "Effient" },
  { generic: "Eptifibatide", brand: "Integrilin" },
  { generic: "Tirofiban", brand: "Aggrastat" },

  // Thrombolytics
  { generic: "Alteplase", brand: "Activase" },
  { generic: "Tenecteplase", brand: "TNKase" },

  // Anticoagulants
  { generic: "Heparin", brand: "Heparin" },
  { generic: "Enoxaparin", brand: "Lovenox" },
  { generic: "Dalteparin", brand: "Fragmin" },
  { generic: "Tinzaparin", brand: "Innohep" },
  { generic: "Fondaparinux", brand: "Arixtra" },
  { generic: "Warfarin", brand: "Coumadin" },
  { generic: "Apixaban", brand: "Eliquis" },
  { generic: "Rivaroxaban", brand: "Xarelto" },
  { generic: "Dabigatran", brand: "Pradaxa" },
  { generic: "Bivalirudin", brand: "Angiomax" },
  { generic: "Argatroban", brand: "Argatroban" },

  // Nitrates
  { generic: "Nitroglycerin", brand: "Nitrostat, Nitrolingual" },
  { generic: "Isosorbide mononitrate", brand: "Imdur" },
  { generic: "Isosorbide dinitrate", brand: "Generics" },

  // Beta-Blockers
  { generic: "Metoprolol", brand: "Lopressor" },
  { generic: "Atenolol", brand: "Tenormin" },
  { generic: "Propranolol", brand: "Inderal" },
  { generic: "Bisoprolol", brand: "Monocor" },
  { generic: "Nadolol", brand: "Corgard" },
  { generic: "Acebutolol", brand: "Sectral" },
  { generic: "Timolol", brand: "Blocadren" },

  // Calcium Channel Blockers
  { generic: "Diltiazem", brand: "Cardizem" },
  { generic: "Verapamil", brand: "Isoptin" },

  // Electrolytes
  { generic: "Calcium gluconate", brand: "Calcium Gluconate" },
  { generic: "Potassium chloride", brand: "K-Dur, K-Cl" },
  { generic: "Magnesium sulfate", brand: "Magnesium Sulfate" }, 
  { generic: "Sodium bicarbonate", brand: "Sodium Bicarbonate" },
  { generic: "Insulin (regular)", brand: "Humulin R, Novolin R" },
  { generic: "Furosemide", brand: "Lasix" }
];