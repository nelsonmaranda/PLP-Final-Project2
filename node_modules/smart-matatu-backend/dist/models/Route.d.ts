import mongoose, { Document } from 'mongoose';
export interface IStop {
    name: string;
    coordinates: [number, number];
    description?: string;
}
export interface IRoute extends Document {
    _id: string;
    name: string;
    description: string;
    path: [number, number][];
    stops: IStop[];
    operator: string;
    fare: number;
    operatingHours: {
        start: string;
        end: string;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IRoute, {}, {}, {}, mongoose.Document<unknown, {}, IRoute, {}, {}> & IRoute & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Route.d.ts.map