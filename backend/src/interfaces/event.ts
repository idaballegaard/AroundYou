export interface Event extends Document {
    eventID: string;
    name: string;
    description: string;
    heroImage: string;
    imageArray: string[];
    price: number;
    link: string;
    gpsPosition: string;
    address?: string;
    city?: string;
    slugArray: string[];
    updateAt: Date;
    isAnnual: boolean;
    startDate: Date;
    endDate: Date;
    openingHours: string[];
    isHidden: boolean;
    hiddenAt?: Date;
    hiddenBy?: string;
}
