export class AppPlan {
    static readonly PERSONAL = new AppPlan("Personal");
    static readonly PRO = new AppPlan("Pro");

    constructor(public readonly name: string) {}

    get isPro(): boolean {
        return this.name.toLowerCase() === "pro";
    }

    get isPersonal(): boolean {
        return this.name.toLowerCase() === "personal";
    }

    get isTeam(): boolean {
        return this.name.toLowerCase() === "team";
    }

    static fromString(p: string | null): AppPlan | null {
        if (!p) return null;
        switch (p.toLowerCase()) {
            case 'personal': return AppPlan.PERSONAL;
            case 'pro': return AppPlan.PRO;
            default: return new AppPlan(p);
        }
    }

    toString(): string {
        return this.name;
    }
}
