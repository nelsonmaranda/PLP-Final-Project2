import mongoose, { Document } from 'mongoose';
export interface IReport extends Document {
    _id: string;
    userId?: string;
    routeId: string;
    reportType: 'delay' | 'safety' | 'crowding' | 'breakdown' | 'other';
    description: string;
    location: {
        coordinates: [number, number];
        address?: string;
    };
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'verified' | 'resolved' | 'dismissed';
    deviceFingerprint: string;
    images?: string[];
    isAnonymous: boolean;
    verifiedBy?: string;
    verifiedAt?: Date;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IReport, {}, {}, {}, mongoose.Document<unknown, {}, IReport, {}, {}> & IReport & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Report.d.ts.map