// ==================== TYPES ====================

export interface WorkoutSet {
  reps: number;
  weight: number; // in kg
  rpe?: number; // Rate of Perceived Exertion (1-10)
  rir?: number; // Reps in Reserve (0-5)
  timeUnderTension?: number; // multiplier for tempo work (default 1.0)
}

export interface Exercise {
  name: string;
  sets: WorkoutSet[];
  rpe?: number;
  rir?: number;
}

export interface UserProfile {
  bodyWeight: number; // kg
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  age?: number;
  gender?: 'male' | 'female' | 'other';
}

export interface MuscleMappingRow {
  exercise_name: string;
  muscle_group: string;
  coefficient: number;
}

export interface MuscleScore {
  muscle: string;
  score: number; // 0-100
  category: 'minimal' | 'low' | 'medium' | 'high';
  rawScore: number;
}

export interface IntensityResult {
  muscleScores: MuscleScore[];
  metadata: {
    totalMusclesWorked: number;
    fitnessLevel: string;
    totalVolume: number;
    highestIntensityMuscle: string;
  };
}

// ==================== CONSTANTS ====================

const FITNESS_LEVEL_MULTIPLIERS = {
  beginner: { threshold: 0.7, recovery: 1.3 },
  intermediate: { threshold: 1.0, recovery: 1.0 },
  advanced: { threshold: 1.3, recovery: 0.8 },
};

const INTENSITY_THRESHOLDS = {
  high: 80,
  medium: 50,
  low: 20,
};

// ==================== MAIN CALCULATOR CLASS ====================

export class MuscleIntensityCalculator {
  private muscleMappings: Map<string, MuscleMappingRow[]>;

  constructor(mappings: MuscleMappingRow[]) {
    this.muscleMappings = new Map();
    mappings.forEach((mapping) => {
      const normalizedName = this.normalizeExerciseName(mapping.exercise_name);
      if (!this.muscleMappings.has(normalizedName)) {
        this.muscleMappings.set(normalizedName, []);
      }
      this.muscleMappings.get(normalizedName)!.push(mapping);
    });
  }

  /**
   * Calculate muscle intensity for a day's workout
   */
  public calculateDailyIntensity(
    exercises: Exercise[],
    userProfile: UserProfile
  ): IntensityResult {
    const muscleRawScores: Map<string, number> = new Map();
    let totalVolume = 0;

    for (let index = 0; index < exercises.length; index++) {
      const exercise = exercises[index];
      const normalizedName = this.normalizeExerciseName(exercise.name);
      const muscleTargets = this.muscleMappings.get(normalizedName);

      if (!muscleTargets || muscleTargets.length === 0) {
        continue;
      }

      const exerciseVolume = this.calculateExerciseVolume(exercise);
      totalVolume += exerciseVolume;

      const effortMultiplier = this.calculateEffortMultiplier(exercise);
      const fatigueFactor = this.calculateFatigueFactor(index, exercises.length);

      muscleTargets.forEach((mapping) => {
        const muscle = mapping.muscle_group;
        const coefficient = mapping.coefficient;
        const muscleContribution =
          exerciseVolume * coefficient * effortMultiplier * fatigueFactor;
        const currentScore = muscleRawScores.get(muscle) || 0;
        muscleRawScores.set(muscle, currentScore + muscleContribution);
      });
    }

    const muscleScores = this.normalizeAndCategorize(
      muscleRawScores,
      userProfile.fitnessLevel
    );

    const highestMuscle = muscleScores.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    return {
      muscleScores,
      metadata: {
        totalMusclesWorked: muscleScores.length,
        fitnessLevel: userProfile.fitnessLevel,
        totalVolume: Math.round(totalVolume),
        highestIntensityMuscle: highestMuscle?.muscle ?? '',
      },
    };
  }

  private calculateExerciseVolume(exercise: Exercise): number {
    let totalVolume = 0;
    exercise.sets.forEach((set) => {
      const reps = set.reps || 0;
      const weight = set.weight || 0;
      const timeUnderTension = set.timeUnderTension || 1.0;
      totalVolume += reps * weight * timeUnderTension;
    });
    return totalVolume;
  }

  private calculateEffortMultiplier(exercise: Exercise): number {
    if (exercise.rpe != null) {
      return exercise.rpe / 10;
    }
    if (exercise.rir !== undefined) {
      return Math.max(0.5, 1 - exercise.rir * 0.1);
    }
    const setRPEs = exercise.sets
      .filter((s) => s.rpe !== undefined)
      .map((s) => s.rpe!);
    if (setRPEs.length > 0) {
      const avgRPE = setRPEs.reduce((a, b) => a + b, 0) / setRPEs.length;
      return avgRPE / 10;
    }
    const setRIRs = exercise.sets
      .filter((s) => s.rir !== undefined)
      .map((s) => s.rir!);
    if (setRIRs.length > 0) {
      const avgRIR = setRIRs.reduce((a, b) => a + b, 0) / setRIRs.length;
      return Math.max(0.5, 1 - avgRIR * 0.1);
    }
    return 0.75;
  }

  private calculateFatigueFactor(
    exerciseIndex: number,
    totalExercises: number
  ): number {
    if (totalExercises <= 1) return 1.0;
    const fatiguePercentage = exerciseIndex / (totalExercises - 1);
    return 1 - fatiguePercentage * 0.15;
  }

  private normalizeAndCategorize(
    rawScores: Map<string, number>,
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  ): MuscleScore[] {
    const multiplier = FITNESS_LEVEL_MULTIPLIERS[fitnessLevel];
    const values = Array.from(rawScores.values());
    const maxScore = Math.max(...values, 1);
    const scores: MuscleScore[] = [];

    rawScores.forEach((rawScore, muscle) => {
      let normalizedScore = (rawScore / maxScore) * 100;
      normalizedScore *= multiplier.threshold;
      normalizedScore = Math.min(100, normalizedScore);
      const category = this.categorizeIntensity(normalizedScore);
      scores.push({
        muscle,
        score: Math.round(normalizedScore),
        category,
        rawScore: Math.round(rawScore),
      });
    });

    return scores.sort((a, b) => b.score - a.score);
  }

  private categorizeIntensity(
    score: number
  ): 'minimal' | 'low' | 'medium' | 'high' {
    if (score >= INTENSITY_THRESHOLDS.high) return 'high';
    if (score >= INTENSITY_THRESHOLDS.medium) return 'medium';
    if (score >= INTENSITY_THRESHOLDS.low) return 'low';
    return 'minimal';
  }

  private normalizeExerciseName(name: string): string {
    return name.toLowerCase().trim();
  }

  public getVisualBar(score: number, maxLength: number = 10): string {
    const filledLength = Math.floor((score / 100) * maxLength);
    const emptyLength = maxLength - filledLength;
    return '█'.repeat(filledLength) + '░'.repeat(emptyLength);
  }

  public formatResults(result: IntensityResult): string {
    let output = '=== MUSCLE INTENSITY ANALYSIS ===\n\n';
    result.muscleScores.forEach((muscleScore) => {
      const bar = this.getVisualBar(muscleScore.score);
      const muscleName = muscleScore.muscle
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      output += `${muscleName.padEnd(16)} ${bar} ${muscleScore.score}% (${muscleScore.category.toUpperCase()})\n`;
    });
    output += `\n=== METADATA ===\n`;
    output += `Fitness Level: ${result.metadata.fitnessLevel}\n`;
    output += `Total Muscles Worked: ${result.metadata.totalMusclesWorked}\n`;
    output += `Total Volume: ${result.metadata.totalVolume} kg\n`;
    output += `Highest Intensity: ${result.metadata.highestIntensityMuscle.replace(/_/g, ' ')}\n`;
    return output;
  }
}

export default MuscleIntensityCalculator;
