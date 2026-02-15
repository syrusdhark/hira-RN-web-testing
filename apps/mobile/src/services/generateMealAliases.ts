// apps/mobile/src/services/generateMealAliases.ts

/**
 * Auto-generates search aliases for a meal based on its name and ingredients
 */
export function generateMealAliases(
    mealName: string,
    ingredients?: Array<{ name: string }>
): string[] {
    const aliases: Set<string> = new Set();

    // Normalize meal name
    const normalized = mealName.toLowerCase().trim();

    // Common abbreviations
    const abbreviations: Record<string, string[]> = {
        chicken: ['chk'],
        breakfast: ['bfast', 'brekkie'],
        sandwich: ['sando', 'sammy'],
        protein: ['pro'],
        smoothie: ['shake'],
        vegetables: ['veggies', 'veg'],
        chocolate: ['choc'],
        'peanut butter': ['pb'],
        'bacon lettuce tomato': ['blt'],
        'grilled cheese': ['gc'],
    };

    // Add abbreviation aliases
    Object.entries(abbreviations).forEach(([full, abbrevs]) => {
        if (normalized.includes(full)) {
            abbrevs.forEach((abbrev) => {
                const aliasName = normalized.replace(full, abbrev);
                if (aliasName !== normalized) {
                    aliases.add(aliasName);
                }
            });
        }
    });

    // Extract key ingredients if provided
    if (ingredients && ingredients.length > 0) {
        const primaryIngredients = ingredients
            .slice(0, 3)
            .map((ing) => ing.name.toLowerCase().trim());

        // Create compound aliases like "chicken rice"
        if (primaryIngredients.length >= 2) {
            const compound = primaryIngredients.join(' ');
            if (compound !== normalized) {
                aliases.add(compound);
            }
        }
    }

    // Meal type detection and aliases
    const mealTypes: Record<string, string[]> = {
        breakfast: ['morning meal', 'am meal'],
        lunch: ['midday meal'],
        dinner: ['evening meal', 'supper'],
        snack: ['quick bite'],
    };

    Object.entries(mealTypes).forEach(([type, typeAliases]) => {
        if (normalized.includes(type)) {
            typeAliases.forEach((alias) => {
                const replaced = normalized.replace(type, alias);
                if (replaced !== normalized) {
                    aliases.add(replaced);
                }
            });
        }
    });

    return Array.from(aliases).filter((alias) => alias.length > 2);
}

/**
 * Suggest common aliases for popular meal patterns
 */
export function suggestCommonAliases(mealName: string): string[] {
    const normalized = mealName.toLowerCase();

    const commonPatterns: Record<string, string[]> = {
        'chicken breast': ['grilled chicken', 'chicken protein'],
        'protein shake': ['post workout shake', 'whey shake', 'protein drink'],
        oatmeal: ['overnight oats', 'porridge', 'oats'],
        'scrambled eggs': ['eggs', 'breakfast eggs'],
        'greek yogurt': ['yogurt', 'high protein yogurt'],
        salad: ['green salad', 'veggie salad'],
        'smoothie bowl': ['acai bowl', 'breakfast bowl'],
        'burrito bowl': ['bowl', 'rice bowl'],
    };

    for (const [pattern, suggestions] of Object.entries(commonPatterns)) {
        if (normalized.includes(pattern)) {
            return suggestions;
        }
    }

    return [];
}

/**
 * Get suggested aliases by combining auto-generated and common patterns
 */
export function getSuggestedAliases(
    mealName: string,
    ingredients?: Array<{ name: string }>
): string[] {
    const auto = generateMealAliases(mealName, ingredients);
    const common = suggestCommonAliases(mealName);

    return [...new Set([...auto, ...common])];
}
