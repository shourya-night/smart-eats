// recipeTransformer.js
// JavaScript module (ESM). Works in Node or browser (bundle for browser).
// Exports processRecipe(recipe, options)
// recipe: { title: string, ingredients: string[], instructions: string | string[] }
// options: {
//   healthLevel: "default"|"low_fat"|"low_sugar"|"high_protein"|"vegan", // currently advisory
//   flavorProfiles: ["spicy", "tangy", ...], // normal flavor palettes
//   cuisines: ["Italian","Indian", ...], // global cuisine palettes (applied in order)
//   spiceLevel: 0-10, sweetness: 0-10, richness: 0-10, // numeric preferences
//   preferPlantBased: boolean, // prefer plant-based alternatives when available
//   replacementStrategy: "best"|"random" // 'best' picks first alt, 'random' picks random alt
// }

///////////////////////
// 1) DATA: replacements + flavor palettes
///////////////////////

const replacements = {
    ingredient_replacements: [
      // --- SWEETENERS ---
      { "unhealthy": "refined sugar", "healthy_alternatives": ["honey", "maple syrup", "date paste", "stevia", "monk fruit", "coconut sugar", "jaggery"] },
      { "unhealthy": "brown sugar", "healthy_alternatives": ["coconut sugar", "date sugar", "maple sugar"] },
      { "unhealthy": "high-fructose corn syrup", "healthy_alternatives": ["honey", "brown rice syrup", "maple syrup"] },
      { "unhealthy": "powdered sugar", "healthy_alternatives": ["blended coconut sugar", "stevia + cornstarch"] },
      { "unhealthy": "artificial sweeteners", "healthy_alternatives": ["stevia", "monk fruit", "erythritol"] },
  
      // --- FATS & OILS ---
      { "unhealthy": "butter", "healthy_alternatives": ["olive oil", "avocado oil", "ghee (use sparingly)", "unsweetened applesauce (baking)"] },
      { "unhealthy": "margarine", "healthy_alternatives": ["nut butters", "olive oil spread", "mashed avocado"] },
      { "unhealthy": "palm oil", "healthy_alternatives": ["sunflower oil", "canola oil", "olive oil"] },
      { "unhealthy": "vegetable shortening", "healthy_alternatives": ["coconut oil (small amounts)", "avocado oil"] },
      { "unhealthy": "deep frying oil", "healthy_alternatives": ["air frying", "oven baking", "steaming"] },
  
      // --- CARBS & GRAINS ---
      { "unhealthy": "white flour", "healthy_alternatives": ["whole wheat flour", "oat flour", "almond flour", "coconut flour"] },
      { "unhealthy": "self-raising flour", "healthy_alternatives": ["whole wheat + baking powder", "spelt flour"] },
      { "unhealthy": "white bread", "healthy_alternatives": ["whole grain bread", "sourdough", "sprouted grain bread"] },
      { "unhealthy": "bagel", "healthy_alternatives": ["whole wheat bagel", "sprouted grain bagel"] },
      { "unhealthy": "white rice", "healthy_alternatives": ["brown rice", "quinoa", "cauliflower rice", "barley"] },
      { "unhealthy": "instant noodles", "healthy_alternatives": ["whole wheat noodles", "rice noodles", "zucchini noodles", "shirataki noodles"] },
      { "unhealthy": "pastries", "healthy_alternatives": ["whole grain muffins", "oatmeal cookies", "banana bread (whole wheat)"] },
      { "unhealthy": "pizza dough", "healthy_alternatives": ["cauliflower crust", "whole wheat crust"] },
      { "unhealthy": "crackers", "healthy_alternatives": ["seed crackers", "whole grain crackers"] },
  
      // --- DAIRY & DESSERTS ---
      { "unhealthy": "heavy cream", "healthy_alternatives": ["greek yogurt", "cashew cream", "coconut milk (light)"] },
      { "unhealthy": "processed cheese", "healthy_alternatives": ["feta", "goat cheese", "nutritional yeast", "plant-based cheese"] },
      { "unhealthy": "ice cream", "healthy_alternatives": ["frozen yogurt", "banana nice cream", "sorbet"] },
      { "unhealthy": "sweetened condensed milk", "healthy_alternatives": ["unsweetened coconut milk + natural sweetener"] },
      { "unhealthy": "whipped cream", "healthy_alternatives": ["coconut cream whip", "greek yogurt topping"] },
      { "unhealthy": "store-bought frosting", "healthy_alternatives": ["greek yogurt + honey", "avocado cacao frosting"] },
      { "unhealthy": "custard", "healthy_alternatives": ["chia seed pudding", "avocado pudding"] },
  
      // --- MEATS & PROTEINS ---
      { "unhealthy": "bacon", "healthy_alternatives": ["turkey bacon", "tempeh bacon", "smoked salmon"] },
      { "unhealthy": "sausages", "healthy_alternatives": ["chicken sausage", "lentil patties", "turkey sausage"] },
      { "unhealthy": "salami", "healthy_alternatives": ["lean turkey slices", "tofu slices", "chicken strips"] },
      { "unhealthy": "fried chicken", "healthy_alternatives": ["air-fried chicken", "oven-baked chicken", "grilled chicken"] },
      { "unhealthy": "red meat", "healthy_alternatives": ["lean beef", "chicken breast", "fish", "lentils"] },
      { "unhealthy": "processed deli meats", "healthy_alternatives": ["grilled chicken breast", "turkey slices"] },
      { "unhealthy": "pork ribs", "healthy_alternatives": ["grilled chicken skewers", "fish fillet"] },
      { "unhealthy": "meatballs (fried)", "healthy_alternatives": ["baked turkey meatballs", "lentil meatballs"] },
  
      // --- SNACKS ---
      { "unhealthy": "potato chips", "healthy_alternatives": ["baked veggie chips", "kale chips", "air-popped popcorn"] },
      { "unhealthy": "french fries", "healthy_alternatives": ["baked sweet potato fries", "air-fried potato wedges"] },
      { "unhealthy": "nachos", "healthy_alternatives": ["baked tortilla chips + salsa", "veggie sticks + guac"] },
      { "unhealthy": "donuts", "healthy_alternatives": ["baked donuts (whole wheat)", "energy balls"] },
      { "unhealthy": "cupcakes", "healthy_alternatives": ["oat muffins", "banana muffins"] },
      { "unhealthy": "packaged cookies", "healthy_alternatives": ["homemade oat cookies", "date balls"] },
      { "unhealthy": "candy", "healthy_alternatives": ["dark chocolate", "dried fruit (no added sugar)"] },
      { "unhealthy": "brownies", "healthy_alternatives": ["black bean brownies", "date brownies"] },
  
      // --- BEVERAGES ---
      { "unhealthy": "soda", "healthy_alternatives": ["sparkling water with lemon", "herbal tea", "fruit-infused water"] },
      { "unhealthy": "energy drinks", "healthy_alternatives": ["green tea", "matcha", "smoothie with protein"] },
      { "unhealthy": "sweetened coffee", "healthy_alternatives": ["black coffee", "latte with oat milk", "cinnamon coffee"] },
      { "unhealthy": "milkshakes", "healthy_alternatives": ["smoothies (banana + nut butter)", "protein shakes with almond milk"] },
      { "unhealthy": "alcoholic cocktails", "healthy_alternatives": ["mocktails (herbal)", "sparkling kombucha"] },
      { "unhealthy": "sports drinks", "healthy_alternatives": ["coconut water", "electrolyte water", "fruit-infused water"] },
  
      // --- CONDIMENTS ---
      { "unhealthy": "mayonnaise", "healthy_alternatives": ["greek yogurt", "avocado spread", "hummus"] },
      { "unhealthy": "ketchup", "healthy_alternatives": ["homemade ketchup", "salsa", "tomato paste + spices"] },
      { "unhealthy": "store-bought salad dressing", "healthy_alternatives": ["olive oil + lemon juice", "tahini dressing"] },
      { "unhealthy": "soy sauce", "healthy_alternatives": ["low-sodium soy sauce", "coconut aminos", "tamari"] },
      { "unhealthy": "barbecue sauce", "healthy_alternatives": ["homemade bbq with dates", "tomato paste + spices"] },
      { "unhealthy": "ranch dressing", "healthy_alternatives": ["greek yogurt ranch", "tahini lemon dip"] },
  
      // --- PROCESSING & PRESERVATIVES ---
      { "unhealthy": "canned soup (high sodium)", "healthy_alternatives": ["homemade broth", "low-sodium canned soup"] },
      { "unhealthy": "store-bought broth (high sodium)", "healthy_alternatives": ["homemade stock", "low-sodium broth"] },
      { "unhealthy": "canned fruit (syrup)", "healthy_alternatives": ["fresh fruit", "canned fruit in water"] },
  
      // more entries to reach 100+ (mix of categories)
      { "unhealthy": "cream cheese", "healthy_alternatives": ["low-fat ricotta", "Greek yogurt cheese", "plant-based cream cheese"] },
      { "unhealthy": "egg mayo", "healthy_alternatives": ["avocado egg salad", "Greek yogurt egg mix"] },
      { "unhealthy": "sweetened cereals", "healthy_alternatives": ["plain oats", "muesli", "homemade granola (low sugar)"] },
      { "unhealthy": "granola bars (commercial, high sugar)", "healthy_alternatives": ["homemade energy bars", "nuts & dried fruit mix"] },
      { "unhealthy": "instant mashed potatoes", "healthy_alternatives": ["mashed cauliflower", "real mashed potatoes with olive oil"] },
      { "unhealthy": "cream soup bases", "healthy_alternatives": ["pureed vegetables + low-fat milk", "cashew cream"] },
      { "unhealthy": "flavoured yogurt (high sugar)", "healthy_alternatives": ["plain greek yogurt + fresh fruit", "unsweetened yogurt + honey"] },
      { "unhealthy": "sweetened nut milks", "healthy_alternatives": ["unsweetened almond milk", "unsweetened oat milk"] },
      { "unhealthy": "store-bought granulated garlic salt", "healthy_alternatives": ["fresh garlic + sea salt (less)"] },
      { "unhealthy": "processed gravy mixes", "healthy_alternatives": ["homemade gravy from pan drippings", "mushroom gravy (low-sodium)"] },
      { "unhealthy": "corn chips (commercial)", "healthy_alternatives": ["baked corn chips", "whole grain crackers"] },
      { "unhealthy": "cheese sauce (processed)", "healthy_alternatives": ["nutritional yeast sauce", "pureed cauliflower-cheese (light)"] },
      { "unhealthy": "store-bought pizza sauce (high sugar)", "healthy_alternatives": ["homemade tomato sauce", "no-sugar tomato passata"] },
      { "unhealthy": "store-bought pancake mix", "healthy_alternatives": ["whole wheat pancake batter", "oat pancakes"] },
      { "unhealthy": "canned tomato sauces (added sugar)", "healthy_alternatives": ["homemade passata", "no-sugar canned tomatoes"] },
      { "unhealthy": "store-bought pasta salad (mayo-based)", "healthy_alternatives": ["olive oil + vinegar pasta salad", "yogurt-dill dressing"] },
      { "unhealthy": "creamy salad mayo-based slaws", "healthy_alternatives": ["vinegar-based slaw", "yogurt slaw"] },
      { "unhealthy": "frozen breaded fish", "healthy_alternatives": ["oven-baked fish fillet", "grilled fish"] },
      { "unhealthy": "cream-based sauces", "healthy_alternatives": ["tomato-based sauces", "cashew cream"] },
      { "unhealthy": "salted butter", "healthy_alternatives": ["unsalted butter (less)", "olive oil"] },
      { "unhealthy": "cream-filled pastries", "healthy_alternatives": ["fruit-topped whole grain pastries", "yogurt parfaits"] },
      { "unhealthy": "sweetened jams", "healthy_alternatives": ["unsweetened fruit compote", "mashed berries"] },
      { "unhealthy": "pre-made pie crusts (shortening)", "healthy_alternatives": ["homemade whole wheat crust", "nut crust"] },
      { "unhealthy": "canned coconut milk (full fat)", "healthy_alternatives": ["light coconut milk", "low-fat dairy or cashew cream"] },
      { "unhealthy": "sweetened condensed coconut milk", "healthy_alternatives": ["unsweetened condensed milk alternatives made with dates"] },
      { "unhealthy": "glazed ham", "healthy_alternatives": ["roasted lean ham with reduced glaze", "roasted turkey breast"] }
      // You can keep appending more entries; this list already exceeds 100 when combined with previous lists.
    ]
  };
  
  // Normal (taste) flavor palettes
  const flavor_adjustments = [
    {
      profile: "spicy",
      add: ["chili flakes", "black pepper", "cayenne pepper", "smoked paprika"],
      reduce: ["sugar", "cream"],
      replace: { "ketchup": "sriracha", "paprika (sweet)": "cayenne pepper" }
    },
    {
      profile: "sweet",
      add: ["honey", "maple syrup", "cinnamon", "vanilla extract"],
      reduce: ["salt", "chili powder"],
      replace: { "lemon": "orange zest" }
    },
    {
      profile: "savory",
      add: ["mushrooms", "nutritional yeast", "roasted garlic", "soy sauce (low sodium)"],
      reduce: ["sugar"],
      replace: { "lemon juice": "miso paste" }
    },
    {
      profile: "tangy",
      add: ["lime juice", "lemon zest", "tamarind", "vinegar"],
      reduce: ["cream", "oil"],
      replace: { "sour cream": "greek yogurt" }
    },
    {
      profile: "herbal",
      add: ["basil", "cilantro", "parsley", "mint"],
      reduce: ["processed sauces"],
      replace: { "dried herbs": "fresh herbs" }
    },
    {
      profile: "smoky",
      add: ["smoked paprika", "charred veggies", "chipotle", "roasted garlic"],
      reduce: ["sugar"],
      replace: {}
    },
    {
      profile: "fresh",
      add: ["lemon zest", "microgreens", "cucumber", "mint"],
      reduce: ["heavy cream"],
      replace: {}
    }
  ];
  
  // Global cuisine palettes
  const cuisine_palettes = {
    "Indian": {
      spices: ["cumin", "coriander", "turmeric", "garam masala"],
      herbs: ["cilantro", "curry leaves", "mint"],
      boosters: ["tamarind", "ginger-garlic paste"],
      subs: {
        "ghee": "olive oil (healthier) or small ghee",
        "cream": "cashew cream or greek yogurt",
        "sugar": "jaggery or date paste"
      }
    },
    "Italian": {
      spices: [],
      herbs: ["basil", "oregano", "rosemary", "thyme"],
      boosters: ["garlic", "olive oil", "sun-dried tomato", "parmesan (or nutritional yeast)"],
      subs: {
        "butter": "olive oil",
        "heavy cream": "cashew cream or ricotta/light milk",
        "white pasta": "whole-grain pasta or zucchini noodles"
      }
    },
    "Mexican": {
      spices: ["cumin", "paprika", "chili powder", "oregano"],
      herbs: ["cilantro"],
      boosters: ["lime juice", "jalapeño", "chipotle", "avocado"],
      subs: {
        "sour cream": "greek yogurt",
        "flour tortillas": "whole-wheat tortillas"
      }
    },
    "Mediterranean": {
      spices: ["oregano", "thyme"],
      herbs: ["parsley", "dill", "mint", "basil"],
      boosters: ["lemon", "garlic", "olive oil", "feta"],
      subs: { "couscous": "quinoa", "lamb (fatty)": "grilled fish or chicken" }
    },
    "Japanese": {
      spices: [],
      herbs: [],
      boosters: ["miso", "soy sauce (low sodium)", "rice vinegar", "sesame"],
      subs: { "white rice": "brown rice", "mayonnaise-heavy dishes": "light mayo or yogurt" }
    },
    "Middle Eastern": {
      spices: ["za'atar", "cumin", "sumac"],
      herbs: ["parsley", "mint"],
      boosters: ["tahini", "lemon", "pomegranate molasses"],
      subs: { "white pita": "whole-grain pita", "lamb (fatty)": "grilled chicken or fish" }
    },
    "American Comfort": {
      spices: [],
      herbs: ["thyme", "parsley"],
      boosters: ["ketchup (low sugar)", "mustard", "ranch (yogurt base)"],
      subs: { "fries": "baked sweet potato fries", "white bread bun": "whole-wheat bun" }
    },
    "Thai": {
      spices: [],
      herbs: ["thai basil", "cilantro"],
      boosters: ["lemongrass", "galangal", "kaffir lime", "fish sauce (or low-sodium soy)"],
      subs: { "full-fat coconut milk": "light coconut milk", "white rice": "brown rice" }
    }
  };
  
  ///////////////////////
  // 2) UTILITIES
  ///////////////////////
  
  /**
   * normalize: remove punctuation, collapse whitespace (for matching)
   */
  function normalize(s) {
    return s.toLowerCase().normalize("NFKD");
  }
  
  /**
   * escapeRegex for building safe regex from ingredient tokens
   */
  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  
  /**
   * buildRegexForTerm: match whole words and simple plurals (butter, butters?, olive oil)
   * We use word boundaries and allow optional plural 's' and small punctuation around.
   */
  function buildRegexForTerm(term) {
    const t = escapeRegex(term.toLowerCase());
    // allow optional plural 's' or 'es' and parentheses etc.
    return new RegExp(`\\b${t}(?:s|es)?\\b`, "gi");
  }
  
  /**
   * chooseAlternative(list, opts) - choose a replacement based on strategy and preferences
   */
  function chooseAlternative(alts, opts = {}) {
    const { replacementStrategy = "best", preferPlantBased = false } = opts;
    if (!alts || alts.length === 0) return null;
    if (replacementStrategy === "random") {
      return alts[Math.floor(Math.random() * alts.length)];
    }
    // 'best' picks first, but respect plant-based if requested
    if (preferPlantBased) {
      const plant = alts.find(a => /tofu|tempeh|lentil|chickpea|nut|plant|almond|oat|soy|vegan|nutritional yeast/i.test(a));
      if (plant) return plant;
    }
    return alts[0];
  }
  
  ///////////////////////
  // 3) CORE: replacements in ingredient lines and instructions
  ///////////////////////
  
  /**
   * replaceIngredientsInLine
   * Replaces any unhealthy token in a single ingredient line or instruction string.
   * It will try to preserve quantity and surrounding text by replacing only the matched token.
   */
  function replaceIngredientsInLine(line, replacementsList, opts = {}) {
    let out = line;
    replacementsList.forEach(entry => {
      const term = entry.unhealthy;
      const alts = entry.healthy_alternatives;
      const regex = buildRegexForTerm(term);
      // If the line contains the term, replace with chosen alt
      if (regex.test(out)) {
        const alt = chooseAlternative(alts, opts);
        if (!alt) return;
        // Replace all matches preserving case where possible (simple approach: if original capitalized, capitalize alt)
        out = out.replace(regex, match => {
          // preserve capitalization of first letter
          if (/[A-Z]/.test(match[0])) {
            return alt.charAt(0).toUpperCase() + alt.slice(1);
          }
          return alt;
        });
      }
    });
    return out;
  }
  
  /**
   * applyReplacementsToIngredients
   * ingredients: array of strings
   */
  function applyReplacementsToIngredients(ingredients, replacementsList, opts = {}) {
    return ingredients.map(line => replaceIngredientsInLine(line, replacementsList, opts));
  }
  
  /**
   * applyReplacementsToInstructions
   * instructions: string or array
   */
  function applyReplacementsToInstructions(instructions, replacementsList, opts = {}) {
    if (Array.isArray(instructions)) {
      return instructions.map(instr => replaceIngredientsInLine(instr, replacementsList, opts));
    } else {
      // treat as big string - replace within
      let out = instructions;
      replacementsList.forEach(entry => {
        const regex = buildRegexForTerm(entry.unhealthy);
        if (regex.test(out)) {
          const alt = chooseAlternative(entry.healthy_alternatives, opts);
          if (!alt) return;
          out = out.replace(regex, match => {
            if (/[A-Z]/.test(match[0])) {
              return alt.charAt(0).toUpperCase() + alt.slice(1);
            }
            return alt;
          });
        }
      });
      return out;
    }
  }
  
  ///////////////////////
  // 4) FLAVOR LAYER: add/reduce/replace seasonings
  ///////////////////////
  
  /**
   * applyFlavorProfile:
   * - Adds spices/herbs listed in flavor profile (if not already present)
   * - Reduces certain ingredients by flagging them in ingredients/instructions (we do simple string replace to "reduce X" comments)
   * - Applies replace map
   */
  function applyFlavorProfile(recipeObj, profileNames = [], opts = {}) {
    const result = { ...recipeObj };
    let ingredients = Array.from(result.ingredients || []);
    let instructions = Array.isArray(result.instructions) ? [...result.instructions] : [result.instructions || ""];
  
    profileNames.forEach(profileName => {
      const profile = flavor_adjustments.find(p => p.profile === profileName.toLowerCase());
      if (!profile) return;
      // Add profile.add items to ingredients if missing
      profile.add.forEach(item => {
        const exists = ingredients.some(line => new RegExp(`\\b${escapeRegex(item)}\\b`, "i").test(line));
        if (!exists) {
          // append to ingredients as a recommended addition (no quantity). Keep as form "1 tsp item (optional for profile)"
          ingredients.push(`${item} (to taste)`);
          instructions = instructions.map(instr => instr + `\nAdd ${item} to taste.`);
        }
      });
      // Reduce entries: mark them as "reduce" by adding note in ingredient lines and instructions
      profile.reduce.forEach(item => {
        ingredients = ingredients.map(line => line.replace(new RegExp(`\\b${escapeRegex(item)}\\b`, "i"), match => `${match} (reduce)`));
        instructions = instructions.map(instr => instr.replace(new RegExp(`\\b${escapeRegex(item)}\\b`, "i"), match => `${match} (use less)`));
      });
      // Replace map
      for (const [k, v] of Object.entries(profile.replace || {})) {
        ingredients = ingredients.map(line => line.replace(new RegExp(`\\b${escapeRegex(k)}\\b`, "i"), v));
        instructions = instructions.map(instr => instr.replace(new RegExp(`\\b${escapeRegex(k)}\\b`, "i"), v));
      }
    });
  
    result.ingredients = ingredients;
    result.instructions = Array.isArray(recipeObj.instructions) ? instructions : instructions.join("\n");
    return result;
  }
  
  /**
   * applyCuisinePalettes:
   * - Add common herbs/spices for each cuisine
   * - Apply cuisine-specific substitutions (subs map)
   */
  function applyCuisinePalettes(recipeObj, cuisineNames = [], opts = {}) {
    const result = { ...recipeObj };
    let ingredients = Array.from(result.ingredients || []);
    let instructions = Array.isArray(result.instructions) ? [...result.instructions] : [result.instructions || ""];
  
    cuisineNames.forEach(cname => {
      const palette = cuisine_palettes[cname];
      if (!palette) return;
      // add spices/herbs/boosters if not present
      [...(palette.spices || []), ...(palette.herbs || []), ...(palette.boosters || [])].forEach(item => {
        const exists = ingredients.some(line => new RegExp(`\\b${escapeRegex(item)}\\b`, "i").test(line));
        if (!exists) {
          ingredients.push(`${item} (to taste)`);
          instructions = instructions.map(instr => instr + `\nConsider adding ${item}.`);
        }
      });
      // apply subs map
      for (const [k, v] of Object.entries(palette.subs || {})) {
        ingredients = ingredients.map(line => line.replace(new RegExp(`\\b${escapeRegex(k)}\\b`, "i"), v));
        instructions = instructions.map(instr => instr.replace(new RegExp(`\\b${escapeRegex(k)}\\b`, "i"), v));
      }
    });
  
    result.ingredients = ingredients;
    result.instructions = Array.isArray(recipeObj.instructions) ? instructions : instructions.join("\n");
    return result;
  }
  
  ///////////////////////
  // 5) Top-level function: processRecipe
  ///////////////////////
  
  /**
   * processRecipe(recipe, options)
   * Steps:
   *  1. Health replacements (unhealthy => healthy)
   *  2. Apply cuisine palettes (adds/replaces)
   *  3. Apply flavor profiles (adds/reduces/replaces)
   *  4. Post-process: optional notes based on preference sliders
   */
  function processRecipe(recipe, options = {}) {
    const defaults = {
      healthLevel: "default",
      flavorProfiles: [],
      cuisines: [],
      spiceLevel: 5,
      sweetness: 5,
      richness: 5,
      preferPlantBased: false,
      replacementStrategy: "best"
    };
    const opts = { ...defaults, ...options };
  
    // Defensive copy
    let working = {
      title: recipe.title || "Untitled",
      ingredients: Array.isArray(recipe.ingredients) ? [...recipe.ingredients] : [],
      instructions: recipe.instructions || ""
    };
  
    // Step 1: Health replacements - replace in ingredients and instructions
    working.ingredients = applyReplacementsToIngredients(working.ingredients, replacements.ingredient_replacements, opts);
    working.instructions = applyReplacementsToInstructions(working.instructions, replacements.ingredient_replacements, opts);
  
    // Step 2: cuisine palettes
    if (opts.cuisines && opts.cuisines.length) {
      working = applyCuisinePalettes(working, opts.cuisines, opts);
    }
  
    // Step 3: flavor profiles
    if (opts.flavorProfiles && opts.flavorProfiles.length) {
      working = applyFlavorProfile(working, opts.flavorProfiles, opts);
    }
  
    // Step 4: preference-driven tweaks (spice/sweetness/richness)
    // - adjust language in instructions & add suggestions
    const notes = [];
    if (opts.spiceLevel <= 3) notes.push("Low spice: reduce added chilies and use mild peppers.");
    else if (opts.spiceLevel >= 8) notes.push("High spice: consider adding extra chili flakes or cayenne.");
  
    if (opts.sweetness <= 3) notes.push("Low sweetness: reduce sweeteners and use more citrus for brightness.");
    else if (opts.sweetness >= 8) notes.push("High sweetness: add honey or maple syrup to taste.");
  
    if (opts.richness <= 3) notes.push("Low richness: use lighter dairy substitutes and reduce oils.");
    else if (opts.richness >= 8) notes.push("High richness: keep cream/cashew cream or olive oil amounts.");
  
    // add advisory for vegan or plant-based
    if (opts.preferPlantBased) notes.push("Preference: plant-based alternatives preferred where possible.");
  
    // Put notes into instructions end
    if (Array.isArray(working.instructions)) {
      working.instructions.push("\nNotes:\n" + notes.join("\n"));
    } else {
      working.instructions = working.instructions + "\n\nNotes:\n" + notes.join("\n");
    }
  
    // return final transformed recipe
    return working;
  }
  
  ///////////////////////
  // 6) Example usage
  ///////////////////////
  
  // Example recipe: Alfredo pasta
  const sampleRecipe = {
    title: "Classic Fettuccine Alfredo",
    ingredients: [
      "200g fettuccine pasta (white)",
      "1/2 cup butter",
      "1 cup heavy cream",
      "1 cup grated parmesan cheese",
      "1 tsp salt",
      "1/2 tsp black pepper",
      "2 cloves garlic, minced"
    ],
    instructions: [
      "Cook pasta in salted boiling water until al dente. Drain.",
      "In a pan, melt butter and add garlic. Pour in heavy cream and simmer.",
      "Stir in grated parmesan until melted and combine with pasta. Season with salt and pepper."
    ]
  };
  
  // Example transform call
  const options = {
    healthLevel: "low_fat",
    flavorProfiles: ["spicy"],            // normal flavor palette(s)
    cuisines: ["Italian"],                // cuisine palette(s)
    spiceLevel: 7, sweetness: 3, richness: 4,
    preferPlantBased: false,
    replacementStrategy: "best"
  };
  
  // Run transformation (uncomment to test in runtime)
  // const transformed = processRecipe(sampleRecipe, options);
  // console.log("Transformed recipe:", JSON.stringify(transformed, null, 2));
  
  ///////////////////////
  // 7) Exports (for ESM)
  ///////////////////////
  
  export {
    processRecipe,
    replacements,
    flavor_adjustments,
    cuisine_palettes
  };
  
  // For Node (if using CommonJS), uncomment:
  // module.exports = { processRecipe, replacements, flavor_adjustments, cuisine_palettes };
  
  