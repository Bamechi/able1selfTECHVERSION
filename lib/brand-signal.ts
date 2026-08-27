/* eslint-disable */
// @ts-nocheck

export type BrandSignalPair = {
  key: string;
  primaryAxis: 1 | 2 | 3 | 4;
  a: { label: string; vote: Record<string, number> };
  b: { label: string; vote: Record<string, number> };
};

export const signalPairs: BrandSignalPair[] = [
	{
		key: "sp_tesla_toyota",
		primaryAxis: 1,
		a: {
			label: "Tesla",
			vote: {
				D: 2,
				F: 1
			}
		},
		b: {
			label: "Toyota",
			vote: {
				H: 2,
				N: 1
			}
		}
	},
	{
		key: "sp_cucinelli_offwhite",
		primaryAxis: 1,
		a: {
			label: "Brunello Cucinelli",
			vote: {
				H: 2,
				E: 1,
				T: 1
			}
		},
		b: {
			label: "Off-White",
			vote: {
				D: 2,
				F: 1,
				W: 1
			}
		}
	},
	{
		key: "sp_goldman_coinbase",
		primaryAxis: 1,
		a: {
			label: "Goldman Sachs",
			vote: {
				H: 2,
				N: 1,
				T: 1
			}
		},
		b: {
			label: "Coinbase",
			vote: {
				D: 2,
				P: 1
			}
		}
	},
	{
		key: "sp_economist_vice",
		primaryAxis: 1,
		a: {
			label: "The Economist",
			vote: {
				H: 2,
				T: 1,
				N: 1
			}
		},
		b: {
			label: "Vice",
			vote: {
				D: 2,
				P: 1,
				W: 1
			}
		}
	},
	{
		key: "sp_apple_microsoft",
		primaryAxis: 2,
		a: {
			label: "Apple",
			vote: {
				E: 2,
				D: 1,
				W: 1
			}
		},
		b: {
			label: "Microsoft",
			vote: {
				P: 2,
				N: 1,
				T: 1
			}
		}
	},
	{
		key: "sp_chatgpt_claude",
		primaryAxis: 2,
		a: {
			label: "ChatGPT",
			vote: {
				P: 2,
				N: 1
			}
		},
		b: {
			label: "Claude",
			vote: {
				E: 2,
				T: 1,
				W: 1
			}
		}
	},
	{
		key: "sp_hermes_nike",
		primaryAxis: 2,
		a: {
			label: "Hermes",
			vote: {
				E: 2,
				H: 1,
				N: 1
			}
		},
		b: {
			label: "Nike",
			vote: {
				P: 2,
				W: 1
			}
		}
	},
	{
		key: "sp_criterion_netflix",
		primaryAxis: 2,
		a: {
			label: "Criterion Collection",
			vote: {
				E: 2,
				H: 1
			}
		},
		b: {
			label: "Netflix",
			vote: {
				P: 2,
				N: 1
			}
		}
	},
	{
		key: "sp_ali_mayweather",
		primaryAxis: 3,
		a: {
			label: "Muhammad Ali",
			vote: {
				W: 2,
				D: 1,
				F: 1
			}
		},
		b: {
			label: "Floyd Mayweather",
			vote: {
				T: 2,
				E: 1,
				F: 1
			}
		}
	},
	{
		key: "sp_oprah_bloomberg",
		primaryAxis: 3,
		a: {
			label: "Oprah",
			vote: {
				W: 2,
				P: 1,
				F: 1
			}
		},
		b: {
			label: "Bloomberg",
			vote: {
				T: 2,
				N: 1,
				E: 1
			}
		}
	},
	{
		key: "sp_traderjoes_erewhon",
		primaryAxis: 3,
		a: {
			label: "Trader Joe's",
			vote: {
				W: 2,
				P: 1
			}
		},
		b: {
			label: "Erewhon",
			vote: {
				T: 1,
				E: 2
			}
		}
	},
	{
		key: "sp_rolls_porsche",
		primaryAxis: 3,
		a: {
			label: "Rolls-Royce",
			vote: {
				W: 1,
				E: 2,
				H: 1
			}
		},
		b: {
			label: "Porsche",
			vote: {
				T: 2,
				H: 1
			}
		}
	},
	{
		key: "sp_tony_19keys",
		primaryAxis: 4,
		a: {
			label: "Tony Robbins",
			vote: {
				F: 1,
				P: 2,
				W: 1
			}
		},
		b: {
			label: "19Keys",
			vote: {
				F: 2,
				E: 1,
				D: 2
			}
		}
	},
	{
		key: "sp_nipsey_rocnation",
		primaryAxis: 4,
		a: {
			label: "Nipsey Hussle",
			vote: {
				F: 2,
				W: 2,
				D: 1
			}
		},
		b: {
			label: "Roc Nation",
			vote: {
				N: 2,
				E: 1
			}
		}
	},
	{
		key: "sp_grok_claude",
		primaryAxis: 4,
		a: {
			label: "Grok",
			vote: {
				F: 2,
				D: 2,
				P: 1
			}
		},
		b: {
			label: "Claude",
			vote: {
				N: 2,
				W: 1,
				T: 1
			}
		}
	},
	{
		key: "sp_issa_michelle",
		primaryAxis: 4,
		a: {
			label: "Issa Rae",
			vote: {
				F: 2,
				D: 1,
				W: 1
			}
		},
		b: {
			label: "Michelle Obama",
			vote: {
				N: 2,
				H: 2,
				E: 1
			}
		}
	}
];
export const rejectionBrands = [
	"Microsoft",
	"Supreme",
	"Tony Robbins",
	"Hermes",
	"Vice",
	"Goldman Sachs",
	"Netflix",
	"Grok"
];
const rejectionVotes = {
	Microsoft: {
		P: 2,
		N: 1,
		T: 1
	},
	Supreme: {
		D: 2,
		P: 1,
		F: 1
	},
	"Tony Robbins": {
		F: 1,
		P: 2,
		W: 1
	},
	Hermes: {
		E: 2,
		H: 1,
		N: 1
	},
	Vice: {
		D: 2,
		P: 1,
		W: 1
	},
	"Goldman Sachs": {
		H: 2,
		N: 1,
		T: 1
	},
	Netflix: {
		P: 2,
		N: 1
	},
	Grok: {
		F: 2,
		D: 2,
		P: 1
	}
};
export const BRAND_SIGNAL_PROFILES = {
	HPWF: {
		name: "The Hometown Authority",
		read: "Authority earned locally, over time, face-to-face. Trusted before known.",
		buys: "Documentary content and local community events"
	},
	HPWN: {
		name: "The Family Institution",
		read: "Legacy and continuity. The name means something before you speak.",
		buys: "Brand bible, heritage storytelling, and succession work"
	},
	HPTF: {
		name: "The Master Teacher",
		read: "A proven method taught plainly to as many people as possible.",
		buys: "Course production, certification, and method protection"
	},
	HPTN: {
		name: "The Standard Bearer",
		read: "You are the benchmark others are measured against.",
		buys: "Standards, certification, trademark portfolio, and trade PR"
	},
	HEWF: {
		name: "The Patron",
		read: "Taste and relationships. Few clients, deep trust, no advertising.",
		buys: "Private-client site, styling, portraiture, and referrals"
	},
	HEWN: {
		name: "The House",
		read: "Built to outlive you. The institution is the asset.",
		buys: "Entity and IP structure, brand bible, and asset vault"
	},
	HETF: {
		name: "The Artisan Authority",
		read: "Named maker, obsessive precision, the work speaks.",
		buys: "Product photography, trademark, and luxury commerce"
	},
	HETN: {
		name: "The Atelier",
		read: "The quiet standard. Never explains and never discounts.",
		buys: "Trademark portfolio, licensing, and editorial placement"
	},
	DPWF: {
		name: "The People's Disruptor",
		read: "Access is the message. You break the gate and hold it open.",
		buys: "Community platform, merchandise, and short-form content"
	},
	DPWN: {
		name: "The Movement",
		read: "Cause first and scale second. The mission outranks the founder.",
		buys: "Entity structure, campaign production, and communications"
	},
	DPTF: {
		name: "The Builder in Public",
		read: "Ship, show the work, and let the receipts recruit.",
		buys: "Newsletter, podcast, technical content, and launch funnel"
	},
	DPTN: {
		name: "The Platform",
		read: "The new utility: indispensable by design.",
		buys: "Product design, documentation, and partner marketing"
	},
	DEWF: {
		name: "The Prophet-Founder",
		read: "Conviction plus scarcity plus a face. Belief is the product.",
		buys: "Speaking, film-grade content, membership, and language protection"
	},
	DEWN: {
		name: "The Cult Brand",
		read: "Belief-driven and gated. Getting in is the value.",
		buys: "Membership platform, drop mechanics, and brand bible"
	},
	DETF: {
		name: "The Category Creator",
		read: "You named the thing. Now you own the word.",
		buys: "Category trademark, book, keynote, and tier-one PR"
	},
	DETN: {
		name: "The New Standard",
		read: "A new institution built to replace an old one.",
		buys: "Full brand system, trademark, and investor communications"
	}
};
const AXES = [
	["H", "D"],
	["P", "E"],
	["W", "T"],
	["F", "N"]
];
export function scoreBrandSignal(answers) {
	const scores = {
		H: 0,
		D: 0,
		P: 0,
		E: 0,
		W: 0,
		T: 0,
		F: 0,
		N: 0
	};
	let answered = 0;
	for (const pair of signalPairs) {
		const selected = answers[pair.key];
		const side = selected === pair.a.label ? pair.a : selected === pair.b.label ? pair.b : null;
		if (!side) continue;
		answered += 1;
		for (const [pole, value] of Object.entries(side.vote)) scores[pole] += value ?? 0;
	}
	if (!answered) return null;
	const rejected = Array.isArray(answers.sp_rejections) ? answers.sp_rejections : [];
	for (const brand of rejected) for (const [pole, value] of Object.entries(rejectionVotes[brand] ?? {})) scores[pole] -= (value ?? 0) * 1.5;
	const letters = [];
	const confidence = [];
	for (const [first, second] of AXES) {
		letters.push(scores[first] >= scores[second] ? first : second);
		confidence.push(Math.min(1, Math.abs(scores[first] - scores[second]) / Math.max(1, Math.abs(scores[first]) + Math.abs(scores[second]))));
	}
	const code = letters.join("");
	return {
		code,
		profile: BRAND_SIGNAL_PROFILES[code],
		scores,
		confidence
	};
}
export function describeSignalTension(identityCode, signal) {
	if (!identityCode || !signal) return null;
	return identityCode[2] === "B" === (signal.code[0] === "D") ? "Your instinct and your image already agree. The work is execution, not discovery." : "Your inner operating style and outward brand ambition create productive tension. Protect your natural energy while choosing deliberately how visible, broad, or disruptive the brand must become.";
}
