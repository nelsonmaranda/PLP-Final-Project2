import mongoose, { Document } from 'mongoose';
export interface IScore extends Document {
    _id: string;
    routeId: string;
    reliability: number;
    safety: number;
    punctuality: number;
    comfort: number;
    overall: number;
    totalReports: number;
    lastCalculated: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IScore, {}, {}, {}, mongoose.Document<unknown, {}, IScore, {}, {}> & IScore & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Score.d.ts.map