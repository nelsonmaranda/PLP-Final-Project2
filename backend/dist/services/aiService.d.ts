import { z } from 'zod';
export declare const inferenceInputSchema: z.ZodObject<{
    routeId: z.ZodString;
    features: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    routeId: string;
    features: Record<string, number>;
}, {
    routeId: string;
    features?: Record<string, number> | undefined;
}>;
export type InferenceInput = z.infer<typeof inferenceInputSchema>;
export type InferenceOutput = {
    success: boolean;
    prediction: number;
    label: string;
    confidence: number;
};
export declare function runInference(input: InferenceInput): Promise<InferenceOutput>;
//# sourceMappingURL=aiService.d.ts.map